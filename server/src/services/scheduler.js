const prisma = require('../db');

// Read config from env
const LIVE_WINDOW_ALL_DAY = process.env.LIVE_WINDOW_ALL_DAY === 'true';
const SLOT_DURATION_MINUTES = parseInt(process.env.SLOT_DURATION_MINUTES || '10', 10);
const LIVE_WINDOW_START = process.env.LIVE_WINDOW_START || '19:30';
const LIVE_WINDOW_END = process.env.LIVE_WINDOW_END || '22:30';

/**
 * Checks if a given time falls within the daily live auction window.
 */
function isInsideLiveWindow(date) {
  if (LIVE_WINDOW_ALL_DAY) return true;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [startH, startM] = LIVE_WINDOW_START.split(':').map(Number);
  const [endH, endM] = LIVE_WINDOW_END.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Calculates the next available sequential auction slot (FIFO scheduler).
 */
async function getNextAuctionSlot() {
  const now = new Date();
  
  // Find the last scheduled auction (highest endTime) that is not CANCELLED
  const lastAuction = await prisma.auction.findFirst({
    where: {
      status: { in: ['UPCOMING', 'LIVE', 'ENDED', 'SOLD'] }
    },
    orderBy: {
      endTime: 'desc'
    }
  });

  let startTime;

  if (lastAuction) {
    // There are already scheduled auctions. Queue the next one right after.
    const lastEndTime = new Date(lastAuction.endTime);
    // If the last scheduled auction's end time is in the past, align start time with now
    startTime = lastEndTime > now ? lastEndTime : now;
  } else {
    // No auctions scheduled yet.
    startTime = now;
  }

  // Adjust start time to fit the live window if not running all day
  if (!LIVE_WINDOW_ALL_DAY) {
    const [startH, startM] = LIVE_WINDOW_START.split(':').map(Number);
    
    // If current time or last auction end time is outside the window, shift to next start
    if (!isInsideLiveWindow(startTime)) {
      const scheduleDate = new Date(startTime);
      const startMinutes = startH * 60 + startM;
      const currentMinutes = scheduleDate.getHours() * 60 + scheduleDate.getMinutes();

      if (currentMinutes > startMinutes) {
        // Already past today's start window, move to tomorrow
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      }
      
      scheduleDate.setHours(startH);
      scheduleDate.setMinutes(startM);
      scheduleDate.setSeconds(0);
      scheduleDate.setMilliseconds(0);
      startTime = scheduleDate;
    }
  }

  // Round seconds and milliseconds for clean logs
  startTime.setSeconds(0);
  startTime.setMilliseconds(0);

  const endTime = new Date(startTime.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
  
  return { startTime, endTime };
}

/**
 * Core ticker loop that runs every second.
 * Evaluates active auctions and executes state transitions.
 */
async function tick(io) {
  try {
    const now = new Date();

    // 1. Process active LIVE auctions
    const liveAuctions = await prisma.auction.findMany({
      where: { status: 'LIVE' },
      include: {
        item: {
          include: {
            seller: {
              select: { id: true, name: true, email: true, reputation: true }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: {
            bidder: {
              select: { id: true, name: true, email: true, reputation: true }
            }
          }
        }
      }
    });

    for (const auction of liveAuctions) {
      if (now >= new Date(auction.endTime)) {
        console.log(`[Scheduler] Ending live auction ${auction.id} (${auction.item.title})...`);
        
        // Transition LIVE -> ENDED
        const highestBid = auction.bids[0];
        
        await prisma.$transaction(async (tx) => {
          await tx.auction.update({
            where: { id: auction.id },
            data: { status: 'ENDED' }
          });

          // Create pending transaction if there's a winner
          if (highestBid) {
            await tx.transaction.create({
              data: {
                auctionId: auction.id,
                sellerId: auction.item.sellerId,
                buyerId: highestBid.bidderId,
                amount: highestBid.amount,
                status: 'PENDING'
              }
            });
          }
        });

        // Broadcast to clients
        io.to(`auction:${auction.id}`).emit('auction:end', {
          auctionId: auction.id,
          status: 'ENDED',
          winner: highestBid ? {
            id: highestBid.bidder.id,
            name: highestBid.bidder.name,
            reputation: highestBid.bidder.reputation
          } : null,
          amount: highestBid ? highestBid.amount : auction.startingBid
        });

        // Broadcast queue update to landing page
        io.emit('auction:update', { auctionId: auction.id, status: 'ENDED' });
      } else {
        // Send countdown updates
        const remainingMs = new Date(auction.endTime).getTime() - now.getTime();
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        
        io.to(`auction:${auction.id}`).emit('auction:tick', {
          auctionId: auction.id,
          remainingSeconds
        });
      }
    }

    // 2. Start UPCOMING auctions that are due to go LIVE
    // Ensure we only activate if no other auction is currently LIVE
    const activeCount = await prisma.auction.count({ where: { status: 'LIVE' } });
    
    if (activeCount === 0) {
      // Find the next upcoming auction that is scheduled to start
      const nextUpcoming = await prisma.auction.findFirst({
        where: {
          status: 'UPCOMING',
          startTime: { lte: now }
        },
        orderBy: { startTime: 'asc' },
        include: { item: true }
      });

      if (nextUpcoming) {
        console.log(`[Scheduler] Activating upcoming auction ${nextUpcoming.id} (${nextUpcoming.item.title})...`);

        // If its start time was in the past (e.g. server was offline),
        // we can shift its endTime to extend for a full slot from now.
        const updatedEndTime = new Date(now.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

        await prisma.auction.update({
          where: { id: nextUpcoming.id },
          data: {
            status: 'LIVE',
            startTime: now,
            endTime: updatedEndTime
          }
        });

        // Broadcast to clients
        io.to(`auction:${nextUpcoming.id}`).emit('auction:start', {
          auctionId: nextUpcoming.id,
          status: 'LIVE',
          endTime: updatedEndTime
        });

        io.emit('auction:update', {
          auctionId: nextUpcoming.id,
          status: 'LIVE',
          endTime: updatedEndTime
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in scheduler tick:', error);
  }
}

/**
 * Initializes the background scheduler.
 */
function startScheduler(io) {
  console.log('[Scheduler] Launching Live Auction Scheduler (Interval: 1s)');
  
  const timer = setInterval(() => {
    tick(io);
  }, 1000);

  return () => clearInterval(timer);
}

module.exports = {
  startScheduler,
  getNextAuctionSlot,
  isInsideLiveWindow
};
