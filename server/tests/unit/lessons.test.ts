import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    lesson: {
      findUnique: vi.fn(),
    },
    exercise: {
      findUnique: vi.fn(),
    },
    assessmentResult: {
      findFirst: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../src/lib/prisma');
const {
  getLessonDetail,
  submitExerciseAnswer,
  getLessonTranscript,
  getUserSkillLevel,
} = await import('../../src/modules/lessons/lessons.service');
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

describe('Lessons Service - getUserSkillLevel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when user has no assessment', async () => {
    mockPrisma.assessmentResult.findFirst.mockResolvedValue(null);

    const level = await getUserSkillLevel('user-1', 'grammar');
    expect(level).toBeNull();
  });

  it('should return skill-specific level from breakdown', async () => {
    mockPrisma.assessmentResult.findFirst.mockResolvedValue({
      overallLevel: 'B1',
      skillBreakdown: [
        { skill: 'grammar', level: 'A2' },
        { skill: 'reading', level: 'B1' },
        { skill: 'listening', level: 'A1' },
        { skill: 'speaking', level: 'A2' },
      ],
    });

    const level = await getUserSkillLevel('user-1', 'grammar');
    expect(level).toBe('A2');
  });

  it('should fall back to overallLevel when skill not in breakdown', async () => {
    mockPrisma.assessmentResult.findFirst.mockResolvedValue({
      overallLevel: 'B2',
      skillBreakdown: [],
    });

    const level = await getUserSkillLevel('user-1', 'reading');
    expect(level).toBe('B2');
  });
});

describe('Lessons Service - getLessonDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return lesson detail with content and exercises', async () => {
    mockPrisma.assessmentResult.findFirst.mockResolvedValue(null);
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      title: 'Basic Grammar',
      curriculum: { skill: 'grammar', level: 'A1' },
      content: [
        { id: 'cb-1', type: 'text', body: 'Learn verbs', fileUrl: null, orderIndex: 0 },
      ],
      exercises: [
        {
          id: 'ex-1',
          type: 'multiple-choice',
          prompt: 'Choose the correct verb',
          options: ['a', 'b', 'c'],
          correctAnswer: 'a',
          explanation: 'Because...',
          referenceAudioUrl: null,
          orderIndex: 0,
        },
      ],
    });

    const result = await getLessonDetail('lesson-1', 'user-1');

    expect(result.id).toBe('lesson-1');
    expect(result.title).toBe('Basic Grammar');
    expect(result.skill).toBe('grammar');
    expect(result.level).toBe('A1');
    expect(result.instructionalContent).toHaveLength(1);
    expect(result.instructionalContent[0].type).toBe('text');
    expect(result.instructionalContent[0].body).toBe('Learn verbs');
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].id).toBe('ex-1');
    expect(result.exercises[0].type).toBe('multiple-choice');
  });

  it('should throw 404 for non-existent lesson', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue(null);

    try {
      await getLessonDetail('non-existent', 'user-1');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('LESSON_NOT_FOUND');
    }
  });

  it('should throw 403 when user level does not match lesson level', async () => {
    mockPrisma.assessmentResult.findFirst.mockResolvedValue({
      overallLevel: 'B2',
      skillBreakdown: [{ skill: 'grammar', level: 'B2' }],
    });
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      title: 'Advanced Grammar',
      curriculum: { skill: 'grammar', level: 'C1' },
      content: [],
      exercises: [],
    });

    try {
      await getLessonDetail('lesson-1', 'user-1');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(403);
      expect((err as any).code).toBe('LEVEL_MISMATCH');
    }
  });

  it('should allow access when user has no assessment (no level check)', async () => {
    mockPrisma.assessmentResult.findFirst.mockResolvedValue(null);
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      title: 'Intro',
      curriculum: { skill: 'grammar', level: 'A1' },
      content: [],
      exercises: [],
    });

    const result = await getLessonDetail('lesson-1', 'user-1');
    expect(result.id).toBe('lesson-1');
  });
});

describe('Lessons Service - submitExerciseAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct=true for matching answer', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      lessonId: 'lesson-1',
      correctAnswer: 'Moien',
      explanation: 'Moien means Hello',
    });

    const result = await submitExerciseAnswer('lesson-1', 'ex-1', 'Moien');

    expect(result.correct).toBe(true);
    expect(result.correctAnswer).toBe('Moien');
    expect(result.explanation).toBe('Moien means Hello');
  });

  it('should be case-insensitive when comparing answers', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      lessonId: 'lesson-1',
      correctAnswer: 'Moien',
      explanation: 'Moien means Hello',
    });

    const result = await submitExerciseAnswer('lesson-1', 'ex-1', 'moien');
    expect(result.correct).toBe(true);
  });

  it('should return correct=false for wrong answer', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      lessonId: 'lesson-1',
      correctAnswer: 'Moien',
      explanation: 'Moien means Hello',
    });

    const result = await submitExerciseAnswer('lesson-1', 'ex-1', 'Äddi');

    expect(result.correct).toBe(false);
    expect(result.correctAnswer).toBe('Moien');
    expect(result.explanation).toBe('Moien means Hello');
  });

  it('should handle array answers by joining them', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      lessonId: 'lesson-1',
      correctAnswer: 'a,b,c',
      explanation: 'Correct matching order',
    });

    const result = await submitExerciseAnswer('lesson-1', 'ex-1', ['a', 'b', 'c']);
    expect(result.correct).toBe(true);
  });

  it('should throw 404 for non-existent exercise', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue(null);

    try {
      await submitExerciseAnswer('lesson-1', 'non-existent', 'answer');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('EXERCISE_NOT_FOUND');
    }
  });

  it('should throw 404 when exercise belongs to different lesson', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      lessonId: 'lesson-2',
      correctAnswer: 'Moien',
      explanation: 'Moien means Hello',
    });

    try {
      await submitExerciseAnswer('lesson-1', 'ex-1', 'Moien');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('EXERCISE_NOT_FOUND');
    }
  });
});

describe('Lessons Service - getLessonTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return transcript text for listening lesson', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      curriculum: { skill: 'listening' },
      content: [
        { id: 'cb-1', type: 'audio', body: null, fileUrl: 'audio.mp3', orderIndex: 0 },
        { id: 'cb-2', type: 'text', body: 'This is the transcript text.', fileUrl: null, orderIndex: 1 },
      ],
    });

    const result = await getLessonTranscript('lesson-1');

    expect(result.text).toBe('This is the transcript text.');
  });

  it('should throw 404 for non-existent lesson', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue(null);

    try {
      await getLessonTranscript('non-existent');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('LESSON_NOT_FOUND');
    }
  });

  it('should throw 400 for non-listening lesson', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      curriculum: { skill: 'grammar' },
      content: [],
    });

    try {
      await getLessonTranscript('lesson-1');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(400);
      expect((err as any).code).toBe('NOT_LISTENING_LESSON');
    }
  });

  it('should throw 404 when listening lesson has no text content block', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      curriculum: { skill: 'listening' },
      content: [
        { id: 'cb-1', type: 'audio', body: null, fileUrl: 'audio.mp3', orderIndex: 0 },
      ],
    });

    try {
      await getLessonTranscript('lesson-1');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('TRANSCRIPT_NOT_FOUND');
    }
  });
});
