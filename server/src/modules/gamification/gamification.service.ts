import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

export type ActivityType = 'lesson_completion' | 'quiz_pass' | 'chapter_completion';

const XP_AMOUNTS: Record<ActivityType, number> = {
  lesson_completion: 10,
  quiz_pass: 25,
  chapter_completion: 50,
};

const ACTIVITY_DESCRIPTIONS: Record<ActivityType, string> = {
  lesson_completion: 'Completed a lesson',
  quiz_pass: 'Passed a chapter quiz',
  chapter_completion: 'Completed a chapter',
};

const BADGE_DEFINITIONS: {
  key: string;
  check: (ctx: BadgeContext) => boolean;
}[] = [
  { key: 'first_chapter', check: (ctx) => ctx.completedChapters >= 1 },
  { key: 'first_quiz', check: (ctx) => ctx.passedQuizzes >= 1 },
  { key: 'xp_500', check: (ctx) => ctx.totalXp >= 500 },
  { key: 'xp_1000', check: (ctx) => ctx.totalXp >= 1000 },
  { key: 'level_complete', check: (ctx) => ctx.completedAllChaptersInLevel },
  { key: 'streak_7', check: (ctx) => ctx.longestStreak >= 7 },
  { key: 'streak_30', check: (ctx) => ctx.longestStreak >= 30 },
  { key: 'streak_100', check: (ctx) => ctx.longestStreak >= 100 },
];

interface BadgeContext {
  totalXp: number;
  completedChapters: number;
  passedQuizzes: number;
  completedAllChaptersInLevel: boolean;
  longestStreak: number;
}

/**
 * Award XP for a completed activity. Idempotent — won't double-award
 * for the same activity type if a duplicate reference already exists.
 */
export async function awardXP(userId: string, activityType: ActivityType, referenceId?: string) {
  const amount = XP_AMOUNTS[activityType];
  if (!amount) {
    throw new AppError(400, 'INVALID_ACTIVITY', `Invalid activity type: ${activityType}`);
  }

  const description = ACTIVITY_DESCRIPTIONS[activityType];

  // Create XP transaction
  await prisma.xPTransaction.create({
    data: {
      userId,
      amount,
      activityType,
      description,
    },
  });

  // Update user's total XP
  await prisma.user.update({
    where: { id: userId },
    data: { totalXp: { increment: amount } },
  });

  return { xpGained: amount, activityType };
}


/**
 * Update the user's streak. Increment if first activity today (UTC),
 * reset if they missed a day, leave unchanged if already active today.
 */
export async function updateStreak(userId: string) {
  const today = getUTCDateString(new Date());

  const streak = await prisma.streak.findUnique({ where: { userId } });

  if (!streak) {
    // First ever activity — create streak
    return prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(today),
      },
    });
  }

  const lastDate = streak.lastActivityDate
    ? getUTCDateString(streak.lastActivityDate)
    : null;

  if (lastDate === today) {
    // Already recorded activity today — no change
    return streak;
  }

  const yesterday = getUTCDateString(new Date(Date.now() - 86400000));

  let newCurrentStreak: number;
  if (lastDate === yesterday) {
    // Consecutive day — increment
    newCurrentStreak = streak.currentStreak + 1;
  } else {
    // Missed a day — reset
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  return prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: new Date(today),
    },
  });
}

/**
 * Check all badge milestones and award any that are newly earned.
 * Uses upsert on [userId, badgeId] to be idempotent.
 */
export async function checkAndAwardBadges(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const [completedChapters, passedQuizzes, streak, allBadges] = await Promise.all([
    prisma.chapterProgress.count({
      where: { userId, allSectionsComplete: true, quizPassed: true },
    }),
    prisma.quizAttempt.count({
      where: { userId, passed: true },
    }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.badge.findMany(),
  ]);

  // Check if user completed all chapters in any level
  const completedAllChaptersInLevel = await checkLevelComplete(userId);

  const ctx: BadgeContext = {
    totalXp: user.totalXp,
    completedChapters,
    passedQuizzes,
    completedAllChaptersInLevel,
    longestStreak: streak?.longestStreak ?? 0,
  };

  const newBadges: string[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (!def.check(ctx)) continue;

    const badge = allBadges.find((b) => b.key === def.key);
    if (!badge) continue;

    // Upsert ensures idempotency — won't fail if already awarded
    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });

    if (!existing) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newBadges.push(badge.key);
    }
  }

  return { newBadges };
}

/**
 * Get gamification summary for a user.
 */
export async function getSummary(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const [streak, badges, recentXpGains] = await Promise.all([
    prisma.streak.findUnique({ where: { userId } }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.xPTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    totalXp: user.totalXp,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    badges: badges.map((ub) => ({
      id: ub.id,
      badgeKey: ub.badge.key,
      name: ub.badge.name,
      description: ub.badge.description,
      iconUrl: ub.badge.iconUrl,
      earnedAt: ub.earnedAt.toISOString(),
    })),
    recentXpGains: recentXpGains.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      activityType: tx.activityType,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
    })),
  };
}

/**
 * Get paginated XP transaction history.
 */
export async function getXPHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.xPTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.xPTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions: transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      activityType: tx.activityType,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
    })),
    total,
  };
}

/**
 * Get earned and locked badges for a user.
 */
export async function getBadges(userId: string) {
  const [allBadges, earnedBadges] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    }),
  ]);

  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId));

  return {
    earned: earnedBadges.map((ub) => ({
      id: ub.id,
      badgeKey: ub.badge.key,
      name: ub.badge.name,
      description: ub.badge.description,
      iconUrl: ub.badge.iconUrl,
      earnedAt: ub.earnedAt.toISOString(),
    })),
    locked: allBadges
      .filter((b) => !earnedBadgeIds.has(b.id))
      .map((b) => ({
        badgeKey: b.key,
        name: b.name,
        description: b.description,
        iconUrl: b.iconUrl,
        criteria: b.criteria,
      })),
  };
}

/**
 * Get streak info for a user.
 */
export async function getStreak(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } });

  return {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastActivityDate: streak?.lastActivityDate?.toISOString() ?? null,
  };
}

// ── Helpers ──────────────────────────────────────────────────

function getUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function checkLevelComplete(userId: string): Promise<boolean> {
  // Get all levels that have chapters
  const levels = await prisma.chapter.groupBy({
    by: ['level', 'learningPath'],
    _count: { id: true },
  });

  for (const group of levels) {
    const completedInGroup = await prisma.chapterProgress.count({
      where: {
        userId,
        quizPassed: true,
        chapter: {
          level: group.level,
          learningPath: group.learningPath,
        },
      },
    });

    if (completedInGroup >= group._count.id && group._count.id > 0) {
      return true;
    }
  }

  return false;
}
