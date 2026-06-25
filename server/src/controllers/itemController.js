const prisma = require('../db');
const { getNextAuctionSlot } = require('../services/scheduler');

async function createItem(req, res) {
  try {
    const { title, description, category, originalValue } = req.body;
    const sellerId = req.user.id;

    if (!title || !description || !category || originalValue === undefined) {
      return res.status(400).json({ message: 'Title, description, category, and originalValue are required' });
    }

    const value = parseFloat(originalValue);
    if (isNaN(value) || value <= 0) {
      return res.status(400).json({ message: 'Original value must be a positive number' });
    }

    // Process uploaded files or fallback to default
    const urls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        urls.push(`/uploads/${file.filename}`);
      });
    } else {
      urls.push('https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1000');
    }

    // Transactionally create item and schedule its auction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create item
      const item = await tx.item.create({
        data: {
          title,
          description,
          category,
          originalValue: value,
          sellerId,
          images: {
            create: urls.map(url => ({ url }))
          }
        },
        include: {
          images: true
        }
      });

      // 2. Compute starting bid
      const startingBid = value * 0.10;

      // 3. Get next available FIFO slot
      // Notice: Since getNextAuctionSlot uses database queries, doing it inside a transaction 
      // is ideal to prevent scheduling overlapping slots.
      // But we can compute it using current database state.
      const now = new Date();
      
      const lastAuction = await tx.auction.findFirst({
        where: {
          status: { in: ['UPCOMING', 'LIVE', 'ENDED', 'SOLD'] }
        },
        orderBy: {
          endTime: 'desc'
        }
      });

      const slotDurationMinutes = parseInt(process.env.SLOT_DURATION_MINUTES || '10', 10);
      let startTime = now;

      if (lastAuction) {
        const lastEndTime = new Date(lastAuction.endTime);
        startTime = lastEndTime > now ? lastEndTime : now;
      }

      // Rounded schedule starts
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);

      const endTime = new Date(startTime.getTime() + slotDurationMinutes * 60 * 1000);

      // Determine initial status: if no active live auctions, and start time is now, go LIVE, otherwise UPCOMING
      const activeLiveCount = await tx.auction.count({
        where: { status: 'LIVE' }
      });
      
      const status = (activeLiveCount === 0 && startTime <= now) ? 'LIVE' : 'UPCOMING';

      const auction = await tx.auction.create({
        data: {
          itemId: item.id,
          startTime,
          endTime,
          startingBid,
          status
        }
      });

      return { item, auction };
    });

    // Notify clients about the new scheduled item
    const io = req.app.get('io');
    if (io) {
      io.emit('auction:update', {
        auctionId: result.auction.id,
        status: result.auction.status,
        type: 'QUEUE_NEW_ITEM'
      });
    }

    return res.status(201).json({
      message: 'Product listed and queued for auction successfully',
      item: result.item,
      auction: result.auction
    });

  } catch (error) {
    console.error('[ItemCtrl] Create item error:', error);
    return res.status(500).json({ message: 'Internal server error while creating listing' });
  }
}

async function getLiveQueue(req, res) {
  try {
    // 1. LIVE NOW
    const liveNow = await prisma.auction.findFirst({
      where: { status: 'LIVE' },
      include: {
        item: {
          include: {
            images: true,
            seller: {
              select: { id: true, name: true, reputation: true }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 5,
          include: {
            bidder: {
              select: { id: true, name: true, reputation: true }
            }
          }
        }
      }
    });

    // 2. UP NEXT
    const upNext = await prisma.auction.findFirst({
      where: { status: 'UPCOMING' },
      orderBy: { startTime: 'asc' },
      include: {
        item: {
          include: {
            images: true,
            seller: {
              select: { id: true, name: true, reputation: true }
            }
          }
        }
      }
    });

    // 3. UPCOMING (All other upcoming sorted by start time)
    const allUpcoming = await prisma.auction.findMany({
      where: { status: 'UPCOMING' },
      orderBy: { startTime: 'asc' },
      include: {
        item: {
          include: {
            images: true,
            seller: {
              select: { id: true, name: true, reputation: true }
            }
          }
        }
      }
    });

    // Remove the "upNext" from upcoming list to make UI representation cleaner
    const upcoming = allUpcoming.filter(a => !upNext || a.id !== upNext.id);

    return res.status(200).json({
      liveNow,
      upNext,
      upcoming
    });

  } catch (error) {
    console.error('[ItemCtrl] Get queue error:', error);
    return res.status(500).json({ message: 'Internal server error while retrieving queue' });
  }
}

async function getAuctionDetails(req, res) {
  try {
    const { id } = req.params;

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            images: true,
            seller: {
              select: { id: true, name: true, reputation: true }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          include: {
            bidder: {
              select: { id: true, name: true, reputation: true }
            }
          }
        }
      }
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction room not found' });
    }

    return res.status(200).json(auction);
  } catch (error) {
    console.error('[ItemCtrl] Get details error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createItem,
  getLiveQueue,
  getAuctionDetails
};
