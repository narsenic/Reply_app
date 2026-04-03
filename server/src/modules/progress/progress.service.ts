import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type SkillComponent = 'grammar' | 'reading' | 'listening' | 'speaking';

const VALID_CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SKILL_COMPONENTS: SkillComponent[] = ['grammar', 'reading', 'listening', 'speaking'];

/**
 * Get the user's per-skill levels from their latest assessment result.
 * Returns a map of skill -> level, plus the overall level.
 */
async function getUserAssessment(userId: string, languageCode: string) {
  const latest = await prisma.assessmentResult.findFirst({
    where: { userId, languageCode },
    orderBy: { completedAt: 'desc' },
  });

  if (!latest) return null;

  const overallLevel = latest.overallLevel as CEFRLevel;
  const breakdown = latest.skillBreakdown as Array<{ skill: string; level: string }>;

  const skillLevels = new Map<SkillComponent, CEFRLevel>();
  if (Array.isArray(breakdown)) {
    for (const entry of breakdown) {
      if (
        SKILL_COMPONENTS.includes(entry.skill as SkillComponent) &&
        VALID_CEFR_LEVELS.includes(entry.level as CEFRLevel)
      ) {
        skillLevels.set(entry.skill as SkillComponent, entry.level as CEFRLevel);
      }
    }
  }

  // Fill in any missing skills with overall level
  for (const skill of SKILL_COMPONENTS) {
    if (!skillLevels.has(skill)) {
      skillLevels.set(skill, overallLevel);
    }
  }

  return { overallLevel, skillLevels };
}

/**
 * GET /api/progress/dashboard
 */
export async function getDashboard(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const languageCode = user.targetLanguageCode;
  const assessment = await getUserAssessment(userId, languageCode);

  // Default to A1 if no assessment
  const overallLevel: CEFRLevel = assessment?.overallLevel ?? 'A1';

  const skills = await Promise.all(
    SKILL_COMPONENTS.map(async (skill) => {
      const level: CEFRLevel = assessment?.skillLevels.get(skill) ?? 'A1';

      // Find the curriculum for this language/level/skill
      const curriculum = await prisma.curriculum.findUnique({
        where: {
          languageCode_level_skill: {
            languageCode,
            level,
            skill,
          },
        },
        include: {
          lessons: { select: { id: true } },
        },
      });

      const totalLessons = curriculum?.lessons.length ?? 0;

      // Count completed lessons for this user in this curriculum
      let completedLessons = 0;
      if (curriculum && totalLessons > 0) {
        const lessonIds = curriculum.lessons.map((l: { id: string }) => l.id);
        completedLessons = await prisma.userProgress.count({
          where: {
            userId,
            lessonId: { in: lessonIds },
            completed: true,
          },
        });
      }

      const percentComplete =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        skill,
        level,
        completedLessons,
        totalLessons,
        percentComplete,
      };
    }),
  );

  return {
    currentLevel: overallLevel,
    targetLanguage: languageCode,
    skills,
  };
}


/**
 * GET /api/progress/history?page=1&limit=20
 */
export async function getProgressHistory(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, completed: true },
      orderBy: { completedAt: 'desc' },
      skip,
      take: limit,
      include: {
        lesson: {
          include: {
            curriculum: { select: { skill: true } },
          },
        },
      },
    }),
    prisma.userProgress.count({
      where: { userId, completed: true },
    }),
  ]);

  return {
    entries: entries.map((entry: any) => ({
      lessonId: entry.lessonId,
      lessonTitle: entry.lesson.title,
      skill: entry.lesson.curriculum.skill as SkillComponent,
      score: entry.score,
      completedAt: entry.completedAt?.toISOString() ?? '',
    })),
    total,
  };
}

/**
 * POST /api/progress/complete
 * Upsert progress record (idempotent on userId+lessonId).
 * Returns levelUp flag when all lessons at current level for a skill are completed.
 */
export async function completeLesson(
  userId: string,
  lessonId: string,
  score: number,
) {
  // Verify lesson exists
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { curriculum: true },
  });

  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', `Lesson not found: ${lessonId}`);
  }

  // Upsert progress record
  await prisma.userProgress.upsert({
    where: {
      userId_lessonId: { userId, lessonId },
    },
    create: {
      userId,
      lessonId,
      score,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      score,
      completed: true,
      completedAt: new Date(),
    },
  });

  // Check for level-up: are all lessons at this level/skill completed?
  const skill = lesson.curriculum.skill as SkillComponent;
  const level = lesson.curriculum.level as CEFRLevel;
  const languageCode = lesson.curriculum.languageCode;

  const curriculum = await prisma.curriculum.findUnique({
    where: {
      languageCode_level_skill: { languageCode, level, skill },
    },
    include: { lessons: { select: { id: true } } },
  });

  let levelUp = false;
  let nextLevel: CEFRLevel | null = null;

  if (curriculum && curriculum.lessons.length > 0) {
    const lessonIds = curriculum.lessons.map((l: { id: string }) => l.id);
    const completedCount = await prisma.userProgress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        completed: true,
      },
    });

    if (completedCount >= curriculum.lessons.length) {
      const currentIdx = VALID_CEFR_LEVELS.indexOf(level);
      if (currentIdx >= 0 && currentIdx < VALID_CEFR_LEVELS.length - 1) {
        levelUp = true;
        nextLevel = VALID_CEFR_LEVELS[currentIdx + 1];
      }
    }
  }

  return {
    lessonId,
    score,
    completed: true,
    ...(levelUp && {
      levelUp: true,
      message: `Congratulations! You completed all ${skill} lessons at ${level}. Ready for ${nextLevel}!`,
      nextLevel,
      skill,
    }),
  };
}
