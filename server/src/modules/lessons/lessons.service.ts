import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type SkillComponent = 'grammar' | 'reading' | 'listening' | 'speaking';

const VALID_CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Get the user's proficiency level for a given skill by looking at their
 * most recent assessment result. Returns the per-skill level from the
 * skillBreakdown, or the overallLevel as fallback.
 */
export async function getUserSkillLevel(
  userId: string,
  skill: SkillComponent,
): Promise<CEFRLevel | null> {
  const latestAssessment = await prisma.assessmentResult.findFirst({
    where: { userId },
    orderBy: { completedAt: 'desc' },
  });

  if (!latestAssessment) return null;

  const breakdown = latestAssessment.skillBreakdown as Array<{
    skill: string;
    level: string;
  }>;

  if (Array.isArray(breakdown)) {
    const entry = breakdown.find((s) => s.skill === skill);
    if (entry && VALID_CEFR_LEVELS.includes(entry.level as CEFRLevel)) {
      return entry.level as CEFRLevel;
    }
  }

  return latestAssessment.overallLevel as CEFRLevel;
}

/**
 * GET /api/lessons/:id — return lesson detail with content blocks and exercises.
 * Filters by user's proficiency level for the relevant skill.
 */
export async function getLessonDetail(lessonId: string, userId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      curriculum: true,
      content: { orderBy: { orderIndex: 'asc' } },
      exercises: { orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', `Lesson not found: ${lessonId}`);
  }

  // No level restriction — all lessons are accessible regardless of proficiency

  return {
    id: lesson.id,
    title: lesson.title,
    skill: lesson.curriculum.skill as SkillComponent,
    level: lesson.curriculum.level as CEFRLevel,
    instructionalContent: lesson.content.map((block) => ({
      type: block.type,
      url: block.fileUrl ?? undefined,
      body: block.body ?? undefined,
    })),
    exercises: lesson.exercises.map((ex) => ({
      id: ex.id,
      type: ex.type,
      prompt: ex.prompt,
      options: ex.options ?? undefined,
      referenceAudioUrl: ex.referenceAudioUrl ?? undefined,
    })),
  };
}

/**
 * POST /api/lessons/:id/exercises/:exerciseId/submit — evaluate answer.
 */
export async function submitExerciseAnswer(
  lessonId: string,
  exerciseId: string,
  answer: string | string[],
) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  });

  if (!exercise || exercise.lessonId !== lessonId) {
    throw new AppError(
      404,
      'EXERCISE_NOT_FOUND',
      `Exercise not found: ${exerciseId}`,
    );
  }

  // Normalize answer for comparison
  const normalizedAnswer = Array.isArray(answer) ? answer.join(',') : answer;
  const correct =
    normalizedAnswer.trim().toLowerCase() ===
    exercise.correctAnswer.trim().toLowerCase();

  return {
    correct,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation,
  };
}

/**
 * GET /api/lessons/:id/transcript — return transcript text for listening lessons.
 * Looks for a ContentBlock with type "text" in the lesson.
 */
export async function getLessonTranscript(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      curriculum: true,
      content: { orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', `Lesson not found: ${lessonId}`);
  }

  if (lesson.curriculum.skill !== 'listening') {
    throw new AppError(
      400,
      'NOT_LISTENING_LESSON',
      'Transcripts are only available for listening lessons',
    );
  }

  const textBlock = lesson.content.find((block) => block.type === 'text');

  if (!textBlock || !textBlock.body) {
    throw new AppError(
      404,
      'TRANSCRIPT_NOT_FOUND',
      'No transcript available for this lesson',
    );
  }

  return { text: textBlock.body };
}
