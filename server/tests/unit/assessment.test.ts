import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    assessmentResult: {
      create: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../src/lib/prisma');
const {
  startAssessment,
  submitAssessment,
  selfSelectLevel,
  percentToLevel,
  getQuestionBank,
  getAssessmentSessions,
} = await import('../../src/modules/assessment/assessment.service');
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

describe('Assessment Service - percentToLevel', () => {
  it('should return A1 for 0-30%', () => {
    expect(percentToLevel(0)).toBe('A1');
    expect(percentToLevel(15)).toBe('A1');
    expect(percentToLevel(30)).toBe('A1');
  });

  it('should return A2 for 31-50%', () => {
    expect(percentToLevel(31)).toBe('A2');
    expect(percentToLevel(40)).toBe('A2');
    expect(percentToLevel(50)).toBe('A2');
  });

  it('should return B1 for 51-65%', () => {
    expect(percentToLevel(51)).toBe('B1');
    expect(percentToLevel(58)).toBe('B1');
    expect(percentToLevel(65)).toBe('B1');
  });

  it('should return B2 for 66-80%', () => {
    expect(percentToLevel(66)).toBe('B2');
    expect(percentToLevel(73)).toBe('B2');
    expect(percentToLevel(80)).toBe('B2');
  });

  it('should return C1 for 81-90%', () => {
    expect(percentToLevel(81)).toBe('C1');
    expect(percentToLevel(85)).toBe('C1');
    expect(percentToLevel(90)).toBe('C1');
  });

  it('should return C2 for 91-100%', () => {
    expect(percentToLevel(91)).toBe('C2');
    expect(percentToLevel(95)).toBe('C2');
    expect(percentToLevel(100)).toBe('C2');
  });
});

describe('Assessment Service - startAssessment', () => {
  beforeEach(() => {
    // Clear sessions between tests
    getAssessmentSessions().clear();
  });

  it('should return an assessmentId and all 4 skill sections', () => {
    const result = startAssessment('user-1');

    expect(result.assessmentId).toBeDefined();
    expect(typeof result.assessmentId).toBe('string');
    expect(result.sections).toEqual(['grammar', 'reading', 'listening', 'speaking']);
  });

  it('should return questions without correct answers', () => {
    const result = startAssessment('user-1');

    expect(result.questions.length).toBeGreaterThan(0);
    for (const q of result.questions) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('skill');
      expect(q).toHaveProperty('prompt');
      expect(q).toHaveProperty('options');
      expect(q).not.toHaveProperty('correctAnswer');
    }
  });

  it('should store the session in memory', () => {
    const result = startAssessment('user-1');
    const sessions = getAssessmentSessions();
    expect(sessions.has(result.assessmentId)).toBe(true);
  });
});

describe('Assessment Service - submitAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAssessmentSessions().clear();
  });

  it('should score all correct answers and return a valid result', async () => {
    const questionBank = getQuestionBank();
    const session = startAssessment('user-1');

    // Answer all questions correctly
    const answers = questionBank.map((q) => ({
      questionId: q.id,
      answer: q.correctAnswer,
    }));

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.assessmentResult.create.mockResolvedValue({});

    const result = await submitAssessment(session.assessmentId, 'user-1', answers);

    expect(result.overallLevel).toBe('C2');
    expect(result.skillBreakdown).toHaveLength(4);
    for (const entry of result.skillBreakdown) {
      expect(['grammar', 'reading', 'listening', 'speaking']).toContain(entry.skill);
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(entry.level);
      expect(entry.level).toBe('C2');
      expect(Array.isArray(entry.strengths)).toBe(true);
      expect(Array.isArray(entry.improvements)).toBe(true);
    }
  });

  it('should score all wrong answers as A1', async () => {
    const session = startAssessment('user-1');

    // Answer all questions incorrectly
    const answers = getQuestionBank().map((q) => ({
      questionId: q.id,
      answer: 'wrong-answer',
    }));

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.assessmentResult.create.mockResolvedValue({});

    const result = await submitAssessment(session.assessmentId, 'user-1', answers);

    expect(result.overallLevel).toBe('A1');
    for (const entry of result.skillBreakdown) {
      expect(entry.level).toBe('A1');
    }
  });

  it('should store the result in the database', async () => {
    const session = startAssessment('user-1');
    const answers = getQuestionBank().map((q) => ({
      questionId: q.id,
      answer: q.correctAnswer,
    }));

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.assessmentResult.create.mockResolvedValue({});

    await submitAssessment(session.assessmentId, 'user-1', answers);

    expect(mockPrisma.assessmentResult.create).toHaveBeenCalledTimes(1);
    const createCall = mockPrisma.assessmentResult.create.mock.calls[0][0];
    expect(createCall.data.userId).toBe('user-1');
    expect(createCall.data.languageCode).toBe('lb');
    expect(createCall.data.overallLevel).toBe('C2');
  });

  it('should clean up the session after submission', async () => {
    const session = startAssessment('user-1');
    const answers = getQuestionBank().map((q) => ({
      questionId: q.id,
      answer: q.correctAnswer,
    }));

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.assessmentResult.create.mockResolvedValue({});

    await submitAssessment(session.assessmentId, 'user-1', answers);

    expect(getAssessmentSessions().has(session.assessmentId)).toBe(false);
  });

  it('should throw 404 for non-existent assessment', async () => {
    try {
      await submitAssessment('non-existent-id', 'user-1', []);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
    }
  });

  it('should throw 403 if user does not own the assessment', async () => {
    const session = startAssessment('user-1');

    try {
      await submitAssessment(session.assessmentId, 'user-2', []);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(403);
    }
  });
});

describe('Assessment Service - selfSelectLevel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an assessment result with the selected level', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.assessmentResult.create.mockResolvedValue({});

    const result = await selfSelectLevel('user-1', 'B1');

    expect(result.overallLevel).toBe('B1');
    expect(result.skillBreakdown).toHaveLength(4);
    for (const entry of result.skillBreakdown) {
      expect(entry.level).toBe('B1');
      expect(['grammar', 'reading', 'listening', 'speaking']).toContain(entry.skill);
    }
  });

  it('should store the self-selected result in the database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.assessmentResult.create.mockResolvedValue({});

    await selfSelectLevel('user-1', 'A2');

    expect(mockPrisma.assessmentResult.create).toHaveBeenCalledTimes(1);
    const createCall = mockPrisma.assessmentResult.create.mock.calls[0][0];
    expect(createCall.data.userId).toBe('user-1');
    expect(createCall.data.overallLevel).toBe('A2');
    expect(createCall.data.languageCode).toBe('lb');
  });

  it('should throw 400 for invalid CEFR level', async () => {
    try {
      await selfSelectLevel('user-1', 'X9' as any);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(400);
    }
  });

  it('should throw 404 for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    try {
      await selfSelectLevel('non-existent', 'B1');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
    }
  });
});
