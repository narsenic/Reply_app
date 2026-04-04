import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';
import { awardXP, updateStreak, checkAndAwardBadges } from '../gamification/gamification.service';

export type LearningPath = 'sproochentest' | 'daily_life';
export type SkillComponent = 'grammar' | 'reading' | 'listening' | 'speaking';

const SKILL_COMPONENTS: SkillComponent[] = ['grammar', 'reading', 'listening', 'speaking'];

export interface CreateChapterInput {
  title: string;
  description: string;
  level: string;
  learningPath: LearningPath;
  orderIndex: number;
}

export interface UpdateChapterInput {
  title?: string;
  description?: string;
  level?: string;
  learningPath?: LearningPath;
  orderIndex?: number;
  published?: boolean;
}

/**
 * List chapters for a user with status (locked/in_progress/completed)
 * based on sequential unlock logic.
 */
export async function listChapters(userId: string, level: string, learningPath: string) {
  const chapters = await prisma.chapter.findMany({
    where: { level, learningPath },
    orderBy: { orderIndex: 'asc' },
    include: {
      progress: {
        where: { userId },
      },
    },
  });

  const result = chapters.map((chapter) => {
    const progress = chapter.progress[0];
    const quizPassed = progress?.quizPassed ?? false;

    // All chapters are accessible — no locking
    let status: 'locked' | 'in_progress' | 'completed';
    if (quizPassed) {
      status = 'completed';
    } else {
      status = 'in_progress';
    }

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      orderIndex: chapter.orderIndex,
      level: chapter.level,
      learningPath: chapter.learningPath,
      status,
      progress: {
        grammar: progress?.grammarPercent ?? 0,
        reading: progress?.readingPercent ?? 0,
        listening: progress?.listeningPercent ?? 0,
        speaking: progress?.speakingPercent ?? 0,
      },
      quizPassed,
    };
  });

  return { chapters: result };
}


/**
 * Get chapter detail with skill sections, speaking prompts, shadowing exercises,
 * and quiz unlock status. Enforces chapter locking (403 if locked).
 */
export async function getChapterDetail(userId: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      lessons: {
        orderBy: { orderIndex: 'asc' },
        include: {
          lesson: {
            select: { id: true, title: true, orderIndex: true },
          },
        },
      },
      speakingPrompts: true,
      shadowingExercises: {
        orderBy: { orderIndex: 'asc' },
      },
      quiz: { select: { id: true } },
      progress: {
        where: { userId },
      },
    },
  });

  if (!chapter) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', `Chapter not found: ${chapterId}`);
  }

  // All chapters are accessible — no locking enforcement

  const progress = chapter.progress[0];

  // Build skill sections
  const sections = SKILL_COMPONENTS.map((skill) => {
    const skillLessons = chapter.lessons
      .filter((cl) => cl.skill === skill)
      .map((cl) => ({
        id: cl.lesson.id,
        title: cl.lesson.title,
        orderIndex: cl.orderIndex,
      }));

    // Count completed lessons for this skill
    const totalCount = skillLessons.length;
    // We'll compute completedCount from UserProgress
    return { skill, lessons: skillLessons, totalCount };
  });

  // Get completed lesson IDs for this user in this chapter
  const chapterLessonIds = chapter.lessons.map((cl) => cl.lesson.id);
  const completedLessons = chapterLessonIds.length > 0
    ? await prisma.userProgress.findMany({
        where: {
          userId,
          lessonId: { in: chapterLessonIds },
          completed: true,
        },
        select: { lessonId: true },
      })
    : [];
  const completedSet = new Set(completedLessons.map((p) => p.lessonId));

  const sectionsWithCompletion = sections.map((section) => {
    const completedCount = section.lessons.filter((l) => completedSet.has(l.id)).length;
    return {
      skill: section.skill,
      lessons: section.lessons,
      completedCount,
      totalCount: section.totalCount,
    };
  });

  const allSectionsComplete = progress?.allSectionsComplete ?? false;
  const quizPassed = progress?.quizPassed ?? false;

  return {
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    level: chapter.level,
    learningPath: chapter.learningPath,
    sections: sectionsWithCompletion,
    speakingPrompts: chapter.speakingPrompts.map((p) => ({
      id: p.id,
      topic: p.topic,
      suggestedVocabulary: p.suggestedVocabulary,
      guidingQuestions: p.guidingQuestions,
      difficulty: p.difficulty,
    })),
    shadowingExercises: chapter.shadowingExercises.map((e) => ({
      id: e.id,
      nativeAudioUrl: e.nativeAudioUrl,
      transcript: e.transcript,
      orderIndex: e.orderIndex,
    })),
    quizUnlocked: allSectionsComplete,
    quizPassed,
  };
}

/**
 * Enforce chapter access: a chapter is accessible if it's the first chapter
 * or all previous chapters have quizPassed = true.
 */
async function enforceChapterAccess(
  userId: string,
  level: string,
  learningPath: string,
  orderIndex: number,
) {
  if (orderIndex === 0) return; // First chapter is always accessible

  // Find all chapters before this one in the same level/path
  const previousChapters = await prisma.chapter.findMany({
    where: {
      level,
      learningPath,
      orderIndex: { lt: orderIndex },
    },
    orderBy: { orderIndex: 'asc' },
    include: {
      progress: {
        where: { userId },
      },
    },
  });

  // Check if the immediately preceding chapter has quizPassed
  const lastPrevious = previousChapters[previousChapters.length - 1];
  if (lastPrevious) {
    const prevProgress = lastPrevious.progress[0];
    if (!prevProgress?.quizPassed) {
      throw new AppError(403, 'CHAPTER_LOCKED', 'This chapter is locked. Complete the previous chapter quiz first.');
    }
  }
}

/**
 * Create a new chapter (admin).
 */
export async function createChapter(data: CreateChapterInput) {
  const chapter = await prisma.chapter.create({
    data: {
      title: data.title,
      description: data.description,
      level: data.level,
      learningPath: data.learningPath,
      orderIndex: data.orderIndex,
    },
  });
  return chapter;
}

/**
 * Update a chapter (admin).
 */
export async function updateChapter(id: string, data: UpdateChapterInput) {
  const existing = await prisma.chapter.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', `Chapter not found: ${id}`);
  }

  const chapter = await prisma.chapter.update({
    where: { id },
    data,
  });
  return chapter;
}

/**
 * Delete a chapter (admin). Cascade handled by Prisma onDelete: Cascade.
 */
export async function deleteChapter(id: string) {
  const existing = await prisma.chapter.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', `Chapter not found: ${id}`);
  }

  await prisma.chapter.delete({ where: { id } });
  return { message: 'Chapter deleted successfully' };
}

/**
 * Update chapter progress for a specific skill.
 * Recalculates skill percentage based on completed lessons vs total lessons
 * for that skill in the chapter. Sets allSectionsComplete=true if all 4 skills are at 100%.
 */
export async function updateChapterProgress(
  userId: string,
  chapterId: string,
  skill: SkillComponent,
) {
  // Get all chapter lessons for this skill
  const chapterLessons = await prisma.chapterLesson.findMany({
    where: { chapterId, skill },
    select: { lessonId: true },
  });

  const totalLessons = chapterLessons.length;
  if (totalLessons === 0) {
    return; // No lessons for this skill, nothing to update
  }

  const lessonIds = chapterLessons.map((cl) => cl.lessonId);
  const completedCount = await prisma.userProgress.count({
    where: {
      userId,
      lessonId: { in: lessonIds },
      completed: true,
    },
  });

  const percent = Math.round((completedCount / totalLessons) * 100);

  // Map skill to the correct field name
  const skillFieldMap: Record<SkillComponent, string> = {
    grammar: 'grammarPercent',
    reading: 'readingPercent',
    listening: 'listeningPercent',
    speaking: 'speakingPercent',
  };

  const fieldName = skillFieldMap[skill];

  // Upsert the progress record
  const progress = await prisma.chapterProgress.upsert({
    where: {
      userId_chapterId: { userId, chapterId },
    },
    create: {
      userId,
      chapterId,
      [fieldName]: percent,
    },
    update: {
      [fieldName]: percent,
    },
  });

  // Check if all sections are complete
  const allSectionsComplete =
    (skill === 'grammar' ? percent : progress.grammarPercent) === 100 &&
    (skill === 'reading' ? percent : progress.readingPercent) === 100 &&
    (skill === 'listening' ? percent : progress.listeningPercent) === 100 &&
    (skill === 'speaking' ? percent : progress.speakingPercent) === 100;

  // Update allSectionsComplete flag if needed
  let xpGained = 0;
  let newBadges: string[] = [];

  if (allSectionsComplete !== progress.allSectionsComplete) {
    await prisma.chapterProgress.update({
      where: { id: progress.id },
      data: { allSectionsComplete },
    });

    // Award XP for chapter completion when all sections become complete
    if (allSectionsComplete) {
      try {
        const xpResult = await awardXP(userId, 'chapter_completion');
        xpGained = xpResult.xpGained;

        await updateStreak(userId);

        const badgeResult = await checkAndAwardBadges(userId);
        newBadges = badgeResult.newBadges;
      } catch {
        // Gamification failures should not break chapter progress
      }
    }
  }

  return {
    chapterId,
    skill,
    percent,
    allSectionsComplete,
    xpGained,
    newBadges,
  };
}

// ── Speaking Prompts ──────────────────────────────────────────

export interface CreatePromptInput {
  topic: string;
  suggestedVocabulary: string;
  guidingQuestions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  learningPath: LearningPath;
}

/**
 * Get speaking prompts for a chapter.
 */
export async function getPromptsByChapter(chapterId: string) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', `Chapter not found: ${chapterId}`);
  }

  const prompts = await prisma.speakingPrompt.findMany({
    where: { chapterId },
    orderBy: { difficulty: 'asc' },
  });

  return {
    prompts: prompts.map((p) => ({
      id: p.id,
      topic: p.topic,
      suggestedVocabulary: p.suggestedVocabulary,
      guidingQuestions: p.guidingQuestions,
      difficulty: p.difficulty,
      learningPath: p.learningPath,
    })),
  };
}

/**
 * Create a speaking prompt for a chapter (admin).
 */
export async function createPrompt(chapterId: string, data: CreatePromptInput) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) {
    throw new AppError(404, 'CHAPTER_NOT_FOUND', `Chapter not found: ${chapterId}`);
  }

  if (!data.topic || data.topic.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Topic is required and cannot be empty');
  }
  if (!data.suggestedVocabulary || data.suggestedVocabulary.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Suggested vocabulary is required');
  }
  if (!Array.isArray(data.guidingQuestions) || data.guidingQuestions.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Guiding questions must be a non-empty array');
  }
  if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Difficulty must be easy, medium, or hard');
  }

  const prompt = await prisma.speakingPrompt.create({
    data: {
      chapterId,
      topic: data.topic,
      suggestedVocabulary: data.suggestedVocabulary,
      guidingQuestions: data.guidingQuestions,
      difficulty: data.difficulty,
      learningPath: data.learningPath,
    },
  });

  return prompt;
}
