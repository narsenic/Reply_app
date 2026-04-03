import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    assessmentResult: {
      findFirst: vi.fn(),
    },
    curriculum: {
      findUnique: vi.fn(),
    },
    userProgress: {
      count: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../src/lib/prisma');
const { getDashboard, getProgressHistory, completeLesson } = await import(
  '../../src/modules/progress/progress.service'
);
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

describe('Progress Service - getDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dashboard with 4 skill entries when user has assessment', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });

    mockPrisma.assessmentResult.findFirst.mockResolvedValue({
      overallLevel: 'B1',
      skillBreakdown: [
        { skill: 'grammar', level: 'B1' },
        { skill: 'reading', level: 'A2' },
        { skill: 'listening', level: 'B1' },
        { skill: 'speaking', level: 'A1' },
      ],
    });

    // Mock curriculum lookups for each skill
    mockPrisma.curriculum.findUnique.mockImplementation(({ where }: any) => {
      const lessons = [{ id: 'lesson-1' }, { id: 'lesson-2' }, { id: 'lesson-3' }];
      return Promise.resolve({
        id: `curr-${where.languageCode_level_skill.skill}`,
        lessons,
      });
    });

    mockPrisma.userProgress.count.mockResolvedValue(1);

    const result = await getDashboard('user-1');

    expect(result.currentLevel).toBe('B1');
    expect(result.targetLanguage).toBe('lb');
    expect(result.skills).toHaveLength(4);

    const skillNames = result.skills.map((s: any) => s.skill);
    expect(skillNames).toContain('grammar');
    expect(skillNames).toContain('reading');
    expect(skillNames).toContain('listening');
    expect(skillNames).toContain('speaking');

    for (const skill of result.skills) {
      expect(skill.totalLessons).toBe(3);
      expect(skill.completedLessons).toBe(1);
      expect(skill.percentComplete).toBe(33);
    }
  });

  it('should default to A1 when user has no assessment', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.assessmentResult.findFirst.mockResolvedValue(null);
    mockPrisma.curriculum.findUnique.mockResolvedValue(null);

    const result = await getDashboard('user-1');

    expect(result.currentLevel).toBe('A1');
    expect(result.skills).toHaveLength(4);
    for (const skill of result.skills) {
      expect(skill.level).toBe('A1');
      expect(skill.totalLessons).toBe(0);
      expect(skill.completedLessons).toBe(0);
      expect(skill.percentComplete).toBe(0);
    }
  });

  it('should throw 404 for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    try {
      await getDashboard('non-existent');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
    }
  });
});

describe('Progress Service - getProgressHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated history entries', async () => {
    const mockEntries = [
      {
        lessonId: 'lesson-1',
        score: 85,
        completedAt: new Date('2024-01-15T10:00:00Z'),
        lesson: {
          title: 'Grammar Basics',
          curriculum: { skill: 'grammar' },
        },
      },
      {
        lessonId: 'lesson-2',
        score: 92,
        completedAt: new Date('2024-01-16T14:30:00Z'),
        lesson: {
          title: 'Reading Intro',
          curriculum: { skill: 'reading' },
        },
      },
    ];

    mockPrisma.userProgress.findMany.mockResolvedValue(mockEntries);
    mockPrisma.userProgress.count.mockResolvedValue(5);

    const result = await getProgressHistory('user-1', 1, 20);

    expect(result.entries).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.entries[0].lessonId).toBe('lesson-1');
    expect(result.entries[0].lessonTitle).toBe('Grammar Basics');
    expect(result.entries[0].skill).toBe('grammar');
    expect(result.entries[0].score).toBe(85);
    expect(result.entries[0].completedAt).toBe('2024-01-15T10:00:00.000Z');
  });

  it('should return empty entries when no history', async () => {
    mockPrisma.userProgress.findMany.mockResolvedValue([]);
    mockPrisma.userProgress.count.mockResolvedValue(0);

    const result = await getProgressHistory('user-1', 1, 20);

    expect(result.entries).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe('Progress Service - completeLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upsert progress and return completion result', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      curriculum: { skill: 'grammar', level: 'A1', languageCode: 'lb' },
    });
    mockPrisma.userProgress.upsert.mockResolvedValue({});
    mockPrisma.curriculum.findUnique.mockResolvedValue({
      lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }, { id: 'lesson-3' }],
    });
    mockPrisma.userProgress.count.mockResolvedValue(1); // only 1 of 3 completed

    const result = await completeLesson('user-1', 'lesson-1', 90);

    expect(result.lessonId).toBe('lesson-1');
    expect(result.score).toBe(90);
    expect(result.completed).toBe(true);
    expect(result).not.toHaveProperty('levelUp');
    expect(mockPrisma.userProgress.upsert).toHaveBeenCalledTimes(1);
  });

  it('should trigger level-up when all lessons at level are completed', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-3',
      curriculum: { skill: 'grammar', level: 'A1', languageCode: 'lb' },
    });
    mockPrisma.userProgress.upsert.mockResolvedValue({});
    mockPrisma.curriculum.findUnique.mockResolvedValue({
      lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }, { id: 'lesson-3' }],
    });
    mockPrisma.userProgress.count.mockResolvedValue(3); // all 3 completed

    const result = await completeLesson('user-1', 'lesson-3', 95);

    expect(result.levelUp).toBe(true);
    expect(result.nextLevel).toBe('A2');
    expect(result.skill).toBe('grammar');
    expect(result.message).toContain('grammar');
    expect(result.message).toContain('A1');
    expect(result.message).toContain('A2');
  });

  it('should not trigger level-up at C2 (highest level)', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      curriculum: { skill: 'reading', level: 'C2', languageCode: 'lb' },
    });
    mockPrisma.userProgress.upsert.mockResolvedValue({});
    mockPrisma.curriculum.findUnique.mockResolvedValue({
      lessons: [{ id: 'lesson-1' }],
    });
    mockPrisma.userProgress.count.mockResolvedValue(1);

    const result = await completeLesson('user-1', 'lesson-1', 100);

    expect(result).not.toHaveProperty('levelUp');
  });

  it('should throw 404 for non-existent lesson', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue(null);

    try {
      await completeLesson('user-1', 'non-existent', 80);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
    }
  });

  it('should be idempotent (upsert on same userId+lessonId)', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      curriculum: { skill: 'grammar', level: 'A1', languageCode: 'lb' },
    });
    mockPrisma.userProgress.upsert.mockResolvedValue({});
    mockPrisma.curriculum.findUnique.mockResolvedValue({
      lessons: [{ id: 'lesson-1' }],
    });
    mockPrisma.userProgress.count.mockResolvedValue(1);

    // Call twice with same userId+lessonId
    await completeLesson('user-1', 'lesson-1', 80);
    await completeLesson('user-1', 'lesson-1', 95);

    // Both calls should use upsert
    expect(mockPrisma.userProgress.upsert).toHaveBeenCalledTimes(2);
    const firstCall = mockPrisma.userProgress.upsert.mock.calls[0][0];
    const secondCall = mockPrisma.userProgress.upsert.mock.calls[1][0];
    expect(firstCall.where.userId_lessonId).toEqual({ userId: 'user-1', lessonId: 'lesson-1' });
    expect(secondCall.where.userId_lessonId).toEqual({ userId: 'user-1', lessonId: 'lesson-1' });
  });
});
