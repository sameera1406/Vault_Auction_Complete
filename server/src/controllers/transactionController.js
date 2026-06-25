const prisma = require('../db');

/**
 * Seller accepts the highest bid of their ended auction
 */
async function sellerAccept(req, res) {
  try {
    const { transactionId } = req.body;
    const sellerId = req.user.id;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { auction: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.sellerId !== sellerId) {
      return res.status(403).json({ message: 'You are not the seller of this auction' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ message: 'This transaction cannot be modified. Status: ' + transaction.status });
    }

    // Mark as approved by seller.
    // We can keep the status as PENDING, but return a message that it is now waiting for the buyer.
    // Let's broadcast the update via socket to the users.
    const io = req.app.get('io');
    if (io) {
      io.emit('auction:update', {
        auctionId: transaction.auctionId,
        status: 'ENDED',
        transactionStatus: 'SELLER_ACCEPTED'
      });
    }

    return res.status(200).json({
      message: 'Bid accepted by seller. Awaiting buyer confirmation.',
      transaction
    });
  } catch (error) {
    console.error('[TxCtrl] Seller accept error:', error);
    return res.status(500).json({ message: 'Internal server error while accepting bid' });
  }
}

/**
 * Seller rejects the highest bid of their ended auction
 */
async function sellerReject(req, res) {
  try {
    const { transactionId } = req.body;
    const sellerId = req.user.id;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { auction: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.sellerId !== sellerId) {
      return res.status(403).json({ message: 'You are not the seller of this auction' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ message: 'This transaction cannot be modified' });
    }

    // Cancel transaction and cancel auction
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'REFUSED' }
      }),
      prisma.auction.update({
        where: { id: transaction.auctionId },
        data: { status: 'CANCELLED' }
      })
    ]);

    const io = req.app.get('io');
    if (io) {
      io.emit('auction:update', {
        auctionId: transaction.auctionId,
        status: 'CANCELLED',
        transactionStatus: 'REFUSED'
      });
    }

    return res.status(200).json({
      message: 'Bid rejected. Auction has been marked as CANCELLED.'
    });
  } catch (error) {
    console.error('[TxCtrl] Seller reject error:', error);
    return res.status(500).json({ message: 'Internal server error while rejecting bid' });
  }
}

/**
 * Buyer confirms and pays for the deal
 */
async function buyerConfirm(req, res) {
  try {
    const { transactionId } = req.body;
    const buyerId = req.user.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.buyerId !== buyerId) {
      return res.status(403).json({ message: 'You are not the winning bidder for this transaction' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ message: 'This transaction is already finalized' });
    }

    // Complete transaction, set auction to SOLD
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' }
      }),
      prisma.auction.update({
        where: { id: transaction.auctionId },
        data: { status: 'SOLD' }
      })
    ]);

    const io = req.app.get('io');
    if (io) {
      io.emit('auction:update', {
        auctionId: transaction.auctionId,
        status: 'SOLD',
        transactionStatus: 'COMPLETED'
      });
    }

    return res.status(200).json({
      message: 'Deal completed successfully. Item marked as SOLD.'
    });
  } catch (error) {
    console.error('[TxCtrl] Buyer confirm error:', error);
    return res.status(500).json({ message: 'Internal server error during finalization' });
  }
}

/**
 * Buyer refuses the deal -> Reputation is halved!
 */
async function buyerRefuse(req, res) {
  try {
    const { transactionId } = req.body;
    const buyerId = req.user.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { buyer: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.buyerId !== buyerId) {
      return res.status(403).json({ message: 'You are not the winning bidder' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ message: 'This transaction is already finalized' });
    }

    // Halve the reputation score
    const currentRep = transaction.buyer.reputation;
    const newRep = Math.max(0, currentRep / 2);

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'REFUSED' }
      }),
      prisma.auction.update({
        where: { id: transaction.auctionId },
        data: { status: 'CANCELLED' }
      }),
      prisma.user.update({
        where: { id: buyerId },
        data: { reputation: newRep }
      })
    ]);

    console.log(`[TxCtrl] User ${transaction.buyer.email} reputation penalized: ${currentRep} -> ${newRep}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('auction:update', {
        auctionId: transaction.auctionId,
        status: 'CANCELLED',
        transactionStatus: 'REFUSED'
      });
    }

    return res.status(200).json({
      message: `Deal refused. Your reputation score has been penalized from ${currentRep} to ${newRep}.`,
      newReputation: newRep
    });
  } catch (error) {
    console.error('[TxCtrl] Buyer refuse error:', error);
    return res.status(500).json({ message: 'Internal server error during refusal' });
  }
}

/**
 * Fetch transaction dashboard statistics for logged-in user
 */
async function getUserTransactions(req, res) {
  try {
    const userId = req.user.id;

    // Sales (where user is the seller)
    const sales = await prisma.transaction.findMany({
      where: { sellerId: userId },
      include: {
        auction: {
          include: { item: true }
        },
        buyer: {
          select: { id: true, name: true, email: true, reputation: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Purchases (where user is the winning bidder)
    const purchases = await prisma.transaction.findMany({
      where: { buyerId: userId },
      include: {
        auction: {
          include: { item: true }
        },
        seller: {
          select: { id: true, name: true, email: true, reputation: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ sales, purchases });
  } catch (error) {
    console.error('[TxCtrl] Get transactions error:', error);
    return res.status(500).json({ message: 'Internal server error fetching dashboard' });
  }
}

module.exports = {
  sellerAccept,
  sellerReject,
  buyerConfirm,
  buyerRefuse,
  getUserTransactions
};
