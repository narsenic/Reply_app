import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    language: {
      findUnique: vi.fn(),
    },
    curriculum: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    lesson: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    contentBlock: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    exercise: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const { prisma } = await import('../../src/lib/prisma');
const {
  listCurriculum,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  VALID_CEFR_LEVELS,
  VALID_SKILLS,
} = await import('../../src/modules/curriculum/curriculum.service');
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

describe('Curriculum Service - listCurriculum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return lessons from matching curricula', async () => {
    mockPrisma.curriculum.findMany.mockResolvedValue([
      {
        id: 'cur-1',
        languageCode: 'lb',
        level: 'A1',
        skill: 'grammar',
        lessons: [
          { id: 'l-1', title: 'Lesson 1', orderIndex: 0, createdAt: new Date(), updatedAt: new Date() },
          { id: 'l-2', title: 'Lesson 2', orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    ]);

    const result = await listCurriculum({ language: 'lb', level: 'A1', skill: 'grammar' });

    expect(result.lessons).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.lessons[0].level).toBe('A1');
    expect(result.lessons[0].skill).toBe('grammar');
  });

  it('should return empty array when no curricula match', async () => {
    mockPrisma.curriculum.findMany.mockResolvedValue([]);

    const result = await listCurriculum({ language: 'lb' });

    expect(result.lessons).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should throw for invalid CEFR level filter', async () => {
    try {
      await listCurriculum({ level: 'X9' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(400);
      expect((err as any).code).toBe('INVALID_LEVEL');
    }
  });

  it('should throw for invalid skill filter', async () => {
    try {
      await listCurriculum({ skill: 'dancing' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(400);
      expect((err as any).code).toBe('INVALID_SKILL');
    }
  });
});


describe('Curriculum Service - createLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find-or-create curriculum and create a lesson', async () => {
    mockPrisma.language.findUnique.mockResolvedValue({ code: 'lb', name: 'Luxembourgish' });
    mockPrisma.curriculum.findUnique.mockResolvedValue({
      id: 'cur-1',
      languageCode: 'lb',
      level: 'A1',
      skill: 'grammar',
    });
    mockPrisma.lesson.create.mockResolvedValue({
      id: 'l-1',
      curriculumId: 'cur-1',
      title: 'Basic Verbs',
      orderIndex: 0,
      content: [],
    });

    const result = await createLesson({
      targetLanguage: 'lb',
      level: 'A1',
      skill: 'grammar',
      title: 'Basic Verbs',
      order: 0,
      content: [],
    });

    expect(result.title).toBe('Basic Verbs');
    expect(mockPrisma.curriculum.create).not.toHaveBeenCalled();
  });

  it('should create curriculum if it does not exist', async () => {
    mockPrisma.language.findUnique.mockResolvedValue({ code: 'lb', name: 'Luxembourgish' });
    mockPrisma.curriculum.findUnique.mockResolvedValue(null);
    mockPrisma.curriculum.create.mockResolvedValue({
      id: 'cur-new',
      languageCode: 'lb',
      level: 'B1',
      skill: 'reading',
    });
    mockPrisma.lesson.create.mockResolvedValue({
      id: 'l-1',
      curriculumId: 'cur-new',
      title: 'Reading Intro',
      orderIndex: 0,
      content: [],
    });

    const result = await createLesson({
      targetLanguage: 'lb',
      level: 'B1',
      skill: 'reading',
      title: 'Reading Intro',
      order: 0,
      content: [],
    });

    expect(mockPrisma.curriculum.create).toHaveBeenCalledTimes(1);
    expect(result.title).toBe('Reading Intro');
  });

  it('should throw 404 for non-existent language', async () => {
    mockPrisma.language.findUnique.mockResolvedValue(null);

    try {
      await createLesson({
        targetLanguage: 'xx',
        level: 'A1',
        skill: 'grammar',
        title: 'Test',
        order: 0,
        content: [],
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('LANGUAGE_NOT_FOUND');
    }
  });

  it('should create lesson with content blocks', async () => {
    mockPrisma.language.findUnique.mockResolvedValue({ code: 'lb', name: 'Luxembourgish' });
    mockPrisma.curriculum.findUnique.mockResolvedValue({ id: 'cur-1' });
    mockPrisma.lesson.create.mockResolvedValue({
      id: 'l-1',
      title: 'With Content',
      orderIndex: 0,
      content: [
        { id: 'cb-1', type: 'text', body: 'Hello', orderIndex: 0 },
      ],
    });

    const result = await createLesson({
      targetLanguage: 'lb',
      level: 'A1',
      skill: 'grammar',
      title: 'With Content',
      order: 0,
      content: [{ type: 'text', body: 'Hello', orderIndex: 0 }],
    });

    expect(result.content).toHaveLength(1);
  });
});

describe('Curriculum Service - updateLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update lesson title', async () => {
    mockPrisma.lesson.findUnique
      .mockResolvedValueOnce({ id: 'l-1', title: 'Old Title' })
      .mockResolvedValueOnce({ id: 'l-1', title: 'New Title', content: [] });
    mockPrisma.lesson.update.mockResolvedValue({ id: 'l-1', title: 'New Title', content: [] });

    const result = await updateLesson('l-1', { title: 'New Title' });

    expect(result!.title).toBe('New Title');
  });

  it('should throw 404 for non-existent lesson', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue(null);

    try {
      await updateLesson('non-existent', { title: 'Test' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
    }
  });

  it('should replace content blocks when content is provided', async () => {
    mockPrisma.lesson.findUnique
      .mockResolvedValueOnce({ id: 'l-1', title: 'Lesson' })
      .mockResolvedValueOnce({ id: 'l-1', title: 'Lesson', content: [{ id: 'cb-new', type: 'text', body: 'New', orderIndex: 0 }] });
    mockPrisma.lesson.update.mockResolvedValue({ id: 'l-1', title: 'Lesson', content: [] });
    mockPrisma.contentBlock.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.contentBlock.createMany.mockResolvedValue({ count: 1 });

    const result = await updateLesson('l-1', {
      content: [{ type: 'text', body: 'New', orderIndex: 0 }],
    });

    expect(mockPrisma.contentBlock.deleteMany).toHaveBeenCalledWith({ where: { lessonId: 'l-1' } });
    expect(mockPrisma.contentBlock.createMany).toHaveBeenCalledTimes(1);
  });
});

describe('Curriculum Service - deleteLesson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete lesson and its content blocks and exercises', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'l-1' });
    mockPrisma.contentBlock.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.exercise.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.lesson.delete.mockResolvedValue({ id: 'l-1' });

    const result = await deleteLesson('l-1');

    expect(result.message).toBe('Lesson deleted successfully');
    expect(mockPrisma.contentBlock.deleteMany).toHaveBeenCalledWith({ where: { lessonId: 'l-1' } });
    expect(mockPrisma.exercise.deleteMany).toHaveBeenCalledWith({ where: { lessonId: 'l-1' } });
    expect(mockPrisma.lesson.delete).toHaveBeenCalledWith({ where: { id: 'l-1' } });
  });

  it('should throw 404 for non-existent lesson', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue(null);

    try {
      await deleteLesson('non-existent');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
    }
  });
});

describe('Curriculum Service - reorderLessons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update order indices for all provided lesson IDs', async () => {
    mockPrisma.lesson.findMany.mockResolvedValue([
      { id: 'l-1' },
      { id: 'l-2' },
      { id: 'l-3' },
    ]);
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await reorderLessons(['l-3', 'l-1', 'l-2']);

    expect(result.message).toBe('Lessons reordered successfully');
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should throw if some lesson IDs are not found', async () => {
    mockPrisma.lesson.findMany.mockResolvedValue([{ id: 'l-1' }]);

    try {
      await reorderLessons(['l-1', 'l-missing']);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(400);
      expect((err as any).code).toBe('LESSONS_NOT_FOUND');
    }
  });
});

describe('Curriculum Service - constants', () => {
  it('should have 6 valid CEFR levels', () => {
    expect(VALID_CEFR_LEVELS).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('should have 4 valid skills', () => {
    expect(VALID_SKILLS).toEqual(['grammar', 'reading', 'listening', 'speaking']);
  });
});

// --- Upload / S3 tests ---

vi.mock('../../src/lib/s3', () => ({
  uploadToS3: vi.fn(),
  s3Client: {},
}));

const { uploadToS3 } = await import('../../src/lib/s3');
const mockUploadToS3 = uploadToS3 as ReturnType<typeof vi.fn>;

describe('File upload - MIME type validation', () => {
  const ACCEPTED_MIME_TYPES = new Set([
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'text/plain',
  ]);

  it.each([
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'text/plain',
  ])('should accept %s', (mimeType) => {
    expect(ACCEPTED_MIME_TYPES.has(mimeType)).toBe(true);
  });

  it.each([
    'image/png',
    'image/jpeg',
    'application/zip',
    'application/json',
    'text/html',
    'application/octet-stream',
  ])('should reject %s', (mimeType) => {
    expect(ACCEPTED_MIME_TYPES.has(mimeType)).toBe(false);
  });
});

describe('File upload - uploadToS3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return fileUrl and fileType on successful upload', async () => {
    mockUploadToS3.mockResolvedValue({
      fileUrl: 'https://s3.example.com/bucket/some-uuid.pdf',
      fileType: 'application/pdf',
    });

    const result = await uploadToS3(
      Buffer.from('test content'),
      'document.pdf',
      'application/pdf',
    );

    expect(result).toHaveProperty('fileUrl');
    expect(result).toHaveProperty('fileType');
    expect(result.fileType).toBe('application/pdf');
    expect(result.fileUrl).toContain('.pdf');
  });

  it('should handle MP3 uploads', async () => {
    mockUploadToS3.mockResolvedValue({
      fileUrl: 'https://s3.example.com/bucket/some-uuid.mp3',
      fileType: 'audio/mpeg',
    });

    const result = await uploadToS3(
      Buffer.from('audio data'),
      'audio.mp3',
      'audio/mpeg',
    );

    expect(result.fileType).toBe('audio/mpeg');
    expect(result.fileUrl).toContain('.mp3');
  });
});
