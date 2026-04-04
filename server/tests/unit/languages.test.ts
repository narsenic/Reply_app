import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    language: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../src/lib/prisma');
const { listLanguages, addLanguage, switchUserLanguage, setLearningPath } = await import(
  '../../src/modules/languages/languages.service'
);
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

describe('Languages Service - listLanguages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all available languages', async () => {
    mockPrisma.language.findMany.mockResolvedValue([
      { code: 'lb', name: 'Luxembourgish', isDefault: true, createdAt: new Date() },
      { code: 'fr', name: 'French', isDefault: false, createdAt: new Date() },
    ]);

    const result = await listLanguages();

    expect(result.languages).toHaveLength(2);
    expect(result.languages[0]).toEqual({ code: 'lb', name: 'Luxembourgish', isDefault: true });
    expect(result.languages[1]).toEqual({ code: 'fr', name: 'French', isDefault: false });
  });

  it('should return empty array when no languages exist', async () => {
    mockPrisma.language.findMany.mockResolvedValue([]);

    const result = await listLanguages();

    expect(result.languages).toHaveLength(0);
  });
});

describe('Languages Service - addLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new language', async () => {
    mockPrisma.language.findUnique.mockResolvedValue(null);
    mockPrisma.language.create.mockResolvedValue({
      code: 'fr',
      name: 'French',
      isDefault: false,
      createdAt: new Date(),
    });

    const result = await addLanguage('fr', 'French');

    expect(result).toEqual({ code: 'fr', name: 'French', isDefault: false });
    expect(mockPrisma.language.create).toHaveBeenCalledWith({
      data: { code: 'fr', name: 'French', isDefault: false },
    });
  });

  it('should throw 409 if language already exists', async () => {
    mockPrisma.language.findUnique.mockResolvedValue({
      code: 'lb',
      name: 'Luxembourgish',
      isDefault: true,
    });

    try {
      await addLanguage('lb', 'Luxembourgish');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(409);
      expect((err as any).code).toBe('LANGUAGE_EXISTS');
    }
  });
});

describe('Languages Service - switchUserLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should switch user target language', async () => {
    mockPrisma.language.findUnique.mockResolvedValue({
      code: 'fr',
      name: 'French',
      isDefault: false,
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'lb',
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      targetLanguageCode: 'fr',
    });

    const result = await switchUserLanguage('user-1', 'fr');

    expect(result.userId).toBe('user-1');
    expect(result.targetLanguageCode).toBe('fr');
    expect(result.message).toContain('French');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { targetLanguageCode: 'fr' },
    });
  });

  it('should throw 404 if language does not exist', async () => {
    mockPrisma.language.findUnique.mockResolvedValue(null);

    try {
      await switchUserLanguage('user-1', 'xx');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('LANGUAGE_NOT_FOUND');
    }
  });

  it('should throw 404 if user does not exist', async () => {
    mockPrisma.language.findUnique.mockResolvedValue({
      code: 'fr',
      name: 'French',
      isDefault: false,
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    try {
      await switchUserLanguage('non-existent', 'fr');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('USER_NOT_FOUND');
    }
  });
});

describe('Languages Service - setLearningPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set learning path to sproochentest', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      learningPath: null,
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      targetLanguageCode: 'lb',
      learningPath: 'sproochentest',
      totalXp: 0,
    });

    const result = await setLearningPath('user-1', 'sproochentest');

    expect(result.id).toBe('user-1');
    expect(result.learningPath).toBe('sproochentest');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { learningPath: 'sproochentest' },
      select: {
        id: true,
        email: true,
        displayName: true,
        targetLanguageCode: true,
        learningPath: true,
        totalXp: true,
      },
    });
  });

  it('should set learning path to daily_life', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      learningPath: null,
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      targetLanguageCode: 'lb',
      learningPath: 'daily_life',
      totalXp: 0,
    });

    const result = await setLearningPath('user-1', 'daily_life');

    expect(result.id).toBe('user-1');
    expect(result.learningPath).toBe('daily_life');
  });

  it('should switch learning path and preserve progress (no ChapterProgress deletion)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      learningPath: 'sproochentest',
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      targetLanguageCode: 'lb',
      learningPath: 'daily_life',
      totalXp: 100,
    });

    const result = await setLearningPath('user-1', 'daily_life');

    expect(result.learningPath).toBe('daily_life');
    // Verify only user.update was called — no chapterProgress deletion
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
  });

  it('should throw 404 if user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    try {
      await setLearningPath('non-existent', 'sproochentest');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('USER_NOT_FOUND');
    }
  });

  it('should return updated user profile with all expected fields', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      learningPath: null,
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      targetLanguageCode: 'lb',
      learningPath: 'sproochentest',
      totalXp: 50,
    });

    const result = await setLearningPath('user-1', 'sproochentest');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email');
    expect(result).toHaveProperty('displayName');
    expect(result).toHaveProperty('targetLanguageCode');
    expect(result).toHaveProperty('learningPath');
    expect(result).toHaveProperty('totalXp');
  });
});
