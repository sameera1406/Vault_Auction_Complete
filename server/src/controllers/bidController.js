const prisma = require('../db');

async function placeBid(req, res) {
  try {
    const { auctionId, amount } = req.body;
    const bidderId = req.user.id;

    if (!auctionId || amount === undefined) {
      return res.status(400).json({ message: 'Auction ID and bid amount are required' });
    }

    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ message: 'Bid amount must be a positive number' });
    }

    // Run transactional bid validation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch auction and lock/check details
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          item: true,
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          }
        }
      });

      if (!auction) {
        throw new Error('AUCTION_NOT_FOUND');
      }

      // 2. Validate auction state
      if (auction.status !== 'LIVE') {
        throw new Error('AUCTION_NOT_LIVE');
      }

      // 3. Validate bidder is not seller
      if (auction.item.sellerId === bidderId) {
        throw new Error('SELLER_CANNOT_BID');
      }

      // 4. Validate bid amount
      const currentHighest = auction.bids[0] ? auction.bids[0].amount : auction.startingBid;
      if (bidAmount <= currentHighest) {
        throw new Error('BID_TOO_LOW');
      }

      // 5. Create new bid
      const newBid = await tx.bid.create({
        data: {
          auctionId,
          bidderId,
          amount: bidAmount
        },
        include: {
          bidder: {
            select: { id: true, name: true, reputation: true }
          }
        }
      });

      return { newBid, currentHighest };
    });

    // Success - Broadcast to Socket.IO room
    const io = req.app.get('io');
    if (io) {
      const roomName = `auction:${auctionId}`;
      
      // Get all bids to send updated history
      const allBids = await prisma.bid.findMany({
        where: { auctionId },
        orderBy: { amount: 'desc' },
        include: {
          bidder: {
            select: { id: true, name: true, reputation: true }
          }
        }
      });

      io.to(roomName).emit('bid:update', {
        auctionId,
        highestBid: result.newBid,
        bidHistory: allBids
      });
    }

    return res.status(201).json({
      message: 'Bid placed successfully',
      bid: result.newBid
    });

  } catch (error) {
    console.error('[BidCtrl] Place bid error:', error);
    
    // Map internal error messages to HTTP statuses
    if (error.message === 'AUCTION_NOT_FOUND') {
      return res.status(404).json({ message: 'Auction room not found' });
    }
    if (error.message === 'AUCTION_NOT_LIVE') {
      return res.status(400).json({ message: 'Bidding is closed or has not started yet' });
    }
    if (error.message === 'SELLER_CANNOT_BID') {
      return res.status(400).json({ message: 'Sellers cannot bid on their own listings' });
    }
    if (error.message === 'BID_TOO_LOW') {
      return res.status(400).json({ message: 'Your bid must exceed the current highest bid' });
    }

    return res.status(500).json({ message: 'Internal server error while placing bid' });
  }
}

module.exports = {
  placeBid
};
