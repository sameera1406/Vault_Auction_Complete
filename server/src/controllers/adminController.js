const prisma = require('../db');

/**
 * Get dashboard stats for administrators
 */
async function getAdminStats(req, res) {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalAuctions = await prisma.auction.count();
    const activeAuctions = await prisma.auction.count({ where: { status: 'LIVE' } });
    const totalBids = await prisma.bid.count();
    const totalTransactions = await prisma.transaction.count();

    // Fetch listings
    const auctions = await prisma.auction.findMany({
      include: {
        item: {
          include: {
            seller: {
              select: { id: true, name: true, email: true, reputation: true }
            }
          }
        },
        bids: {
          orderBy: { amount: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch users (specifically potential low reputation, suspicious)
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        reputation: true,
        createdAt: true,
        _count: {
          select: { bids: true, items: true }
        }
      },
      orderBy: { reputation: 'asc' } // Low reputation first
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalAuctions,
        activeAuctions,
        totalBids,
        totalTransactions
      },
      auctions,
      users
    });
  } catch (error) {
    console.error('[AdminCtrl] Get stats error:', error);
    return res.status(500).json({ message: 'Internal server error fetching admin stats' });
  }
}

/**
 * Remove an item and its associated auction
 */
async function deleteAuction(req, res) {
  try {
    const { id } = req.params; // Auction ID

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: { item: true }
    });

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Delete item (this will cascade delete the auction and bids due to Prisma relation setup)
    await prisma.item.delete({
      where: { id: auction.itemId }
    });

    console.log(`[Admin] Deleted listing ${auction.item.title} (Auction ID: ${id})`);

    const io = req.app.get('io');
    if (io) {
      io.emit('auction:update', {
        auctionId: id,
        status: 'DELETED',
        type: 'QUEUE_ITEM_DELETED'
      });
    }

    return res.status(200).json({ message: 'Listing and auction removed successfully' });
  } catch (error) {
    console.error('[AdminCtrl] Delete auction error:', error);
    return res.status(500).json({ message: 'Internal server error while removing listing' });
  }
}

/**
 * Remove/Ban a fake user
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params; // User ID

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete an administrator account' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    console.log(`[Admin] Banned and deleted user: ${user.email}`);

    return res.status(200).json({ message: 'User account removed successfully' });
  } catch (error) {
    console.error('[AdminCtrl] Delete user error:', error);
    return res.status(500).json({ message: 'Internal server error while deleting user' });
  }
}

module.exports = {
  getAdminStats,
  deleteAuction,
  deleteUser
};
