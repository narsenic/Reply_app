import { prisma } from '../../lib/prisma';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalXp: number;
  currentStreak: number;
  badgeCount: number;
}

interface LeaderboardResult {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;
}

export async function getLeaderboard(
  userId: string,
  period: LeaderboardPeriod,
  limit: number,
): Promise<LeaderboardResult> {
  if (period === 'all_time') {
    return getAllTimeLeaderboard(userId, limit);
  }
  return getPeriodLeaderboard(userId, period, limit);
}

async function getAllTimeLeaderboard(
  userId: string,
  limit: number,
): Promise<LeaderboardResult> {
  const users = await prisma.user.findMany({
    orderBy: { totalXp: 'desc' },
    take: limit,
    select: {
      id: true,
      displayName: true,
      totalXp: true,
      streak: { select: { currentStreak: true } },
      _count: { select: { badges: true } },
    },
  });

  const entries: LeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    displayName: u.displayName,
    totalXp: u.totalXp,
    currentStreak: u.streak?.currentStreak ?? 0,
    badgeCount: u._count.badges,
  }));

  const userRank = await getUserRankAllTime(userId, entries);

  return { period: 'all_time', entries, userRank };
}

async function getUserRankAllTime(
  userId: string,
  entries: LeaderboardEntry[],
): Promise<LeaderboardEntry | null> {
  const found = entries.find((e) => e.userId === userId);
  if (found) return found;

  // User not in top N — calculate their rank
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      totalXp: true,
      streak: { select: { currentStreak: true } },
      _count: { select: { badges: true } },
    },
  });

  if (!user) return null;

  const rank = await prisma.user.count({
    where: { totalXp: { gt: user.totalXp } },
  });

  return {
    rank: rank + 1,
    userId: user.id,
    displayName: user.displayName,
    totalXp: user.totalXp,
    currentStreak: user.streak?.currentStreak ?? 0,
    badgeCount: user._count.badges,
  };
}

async function getPeriodLeaderboard(
  userId: string,
  period: 'weekly' | 'monthly',
  limit: number,
): Promise<LeaderboardResult> {
  const startDate = getPeriodStart(period);

  // Aggregate XP transactions from the period, grouped by user
  const aggregated = await prisma.xPTransaction.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startDate } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: limit,
  });

  const userIds = aggregated.map((a) => a.userId);

  // Fetch user details for the top users
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      displayName: true,
      totalXp: true,
      streak: { select: { currentStreak: true } },
      _count: { select: { badges: true } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const entries: LeaderboardEntry[] = aggregated.map((a, i) => {
    const u = userMap.get(a.userId);
    return {
      rank: i + 1,
      userId: a.userId,
      displayName: u?.displayName ?? 'Unknown',
      totalXp: a._sum.amount ?? 0,
      currentStreak: u?.streak?.currentStreak ?? 0,
      badgeCount: u?._count.badges ?? 0,
    };
  });

  const userRank = await getUserRankPeriod(userId, entries, startDate);

  return { period, entries, userRank };
}

async function getUserRankPeriod(
  userId: string,
  entries: LeaderboardEntry[],
  startDate: Date,
): Promise<LeaderboardEntry | null> {
  const found = entries.find((e) => e.userId === userId);
  if (found) return found;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      streak: { select: { currentStreak: true } },
      _count: { select: { badges: true } },
    },
  });

  if (!user) return null;

  const userXpAgg = await prisma.xPTransaction.aggregate({
    where: { userId, createdAt: { gte: startDate } },
    _sum: { amount: true },
  });

  const userXp = userXpAgg._sum.amount ?? 0;

  // Count how many users have more XP in this period
  const usersAbove = await prisma.xPTransaction.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startDate } },
    _sum: { amount: true },
    having: { amount: { _sum: { gt: userXp } } },
  });

  return {
    rank: usersAbove.length + 1,
    userId: user.id,
    displayName: user.displayName,
    totalXp: userXp,
    currentStreak: user.streak?.currentStreak ?? 0,
    badgeCount: user._count.badges,
  };
}

function getPeriodStart(period: 'weekly' | 'monthly'): Date {
  const now = new Date();

  if (period === 'weekly') {
    // Monday of current week (UTC)
    const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? 6 : day - 1; // days since Monday
    const monday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - diff,
    ));
    return monday;
  }

  // Monthly: first day of current month (UTC)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
