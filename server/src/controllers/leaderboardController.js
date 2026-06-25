const prisma = require('../db');

async function getLeaderboard(req, res) {
  try {
    // Retrieve users, sort them by reputation desc
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        reputation: true,
        _count: {
          select: {
            bids: true,
            purchases: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      },
      orderBy: [
        { reputation: 'desc' },
        { email: 'asc' }
      ],
      take: 20
    });

    // Map to a clean response model
    const rankList = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      reputation: user.reputation,
      bidsCount: user._count.bids,
      winsCount: user._count.purchases
    }));

    return res.status(200).json(rankList);
  } catch (error) {
    console.error('[LeaderboardCtrl] Get leaderboard error:', error);
    return res.status(500).json({ message: 'Internal server error fetching leaderboard' });
  }
}

module.exports = {
  getLeaderboard
};
