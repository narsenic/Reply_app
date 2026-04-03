import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    exercise: {
      findUnique: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../src/lib/prisma');
const { evaluateSpeaking } = await import('../../src/modules/speaking/speaking.service');
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

function makeAudioFile(size = 1024): Express.Multer.File {
  return {
    fieldname: 'audioBlob',
    originalname: 'recording.webm',
    encoding: '7bit',
    mimetype: 'audio/webm',
    size,
    buffer: Buffer.alloc(size),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };
}

describe('Speaking Service - evaluateSpeaking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw 400 when no audio file is provided', async () => {
    try {
      await evaluateSpeaking('ex-1', undefined);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(400);
      expect((err as any).code).toBe('AUDIO_REQUIRED');
    }
  });

  it('should throw 413 when audio file exceeds 10MB', async () => {
    const bigFile = makeAudioFile(11 * 1024 * 1024);

    try {
      await evaluateSpeaking('ex-1', bigFile);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(413);
      expect((err as any).code).toBe('AUDIO_TOO_LARGE');
    }
  });

  it('should throw 404 when exercise does not exist', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue(null);

    try {
      await evaluateSpeaking('non-existent', makeAudioFile());
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('EXERCISE_NOT_FOUND');
    }
  });

  it('should throw 400 when exercise is not a speaking exercise', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      type: 'multiple-choice',
      referenceAudioUrl: 'https://s3.example.com/ref.mp3',
    });

    try {
      await evaluateSpeaking('ex-1', makeAudioFile());
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(400);
      expect((err as any).code).toBe('NOT_SPEAKING_EXERCISE');
    }
  });

  it('should throw 422 when exercise has no reference audio', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      type: 'speaking',
      referenceAudioUrl: null,
    });

    try {
      await evaluateSpeaking('ex-1', makeAudioFile());
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(422);
      expect((err as any).code).toBe('REFERENCE_AUDIO_UNAVAILABLE');
    }
  });

  it('should return score, feedback, and referenceAudioUrl for valid request', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      type: 'speaking',
      referenceAudioUrl: 'https://s3.example.com/ref.mp3',
    });

    const result = await evaluateSpeaking('ex-1', makeAudioFile());

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThanOrEqual(95);
    expect(typeof result.feedback).toBe('string');
    expect(result.feedback.length).toBeGreaterThan(0);
    expect(result.referenceAudioUrl).toBe('https://s3.example.com/ref.mp3');
  });

  it('should accept audio file exactly at 10MB limit', async () => {
    const exactLimitFile = makeAudioFile(10 * 1024 * 1024);
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      type: 'speaking',
      referenceAudioUrl: 'https://s3.example.com/ref.mp3',
    });

    const result = await evaluateSpeaking('ex-1', exactLimitFile);

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThanOrEqual(95);
  });
});
