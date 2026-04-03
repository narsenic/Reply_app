import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    groupSession: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    groupSessionParticipant: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    lesson: {
      findFirst: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../src/lib/prisma');
const {
  joinGroupSession,
  removeParticipant,
  saveChatMessage,
  getUserActiveSessions,
} = await import('../../src/modules/groups/groups.service');
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

describe('Groups Service - joinGroupSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return existing session if user is already a participant', async () => {
    mockPrisma.groupSessionParticipant.findFirst.mockResolvedValue({
      id: 'part-1',
      userId: 'user-1',
      sessionId: 'session-1',
      session: {
        id: 'session-1',
        level: 'A1',
        languageCode: 'lb',
        active: true,
        participants: [
          { user: { id: 'user-1', displayName: 'Alice' } },
        ],
        currentLesson: {
          id: 'lesson-1',
          title: 'Intro',
          curriculum: { skill: 'grammar', level: 'A1' },
        },
      },
    });

    const result = await joinGroupSession('user-1', 'A1', 'lb');

    expect(result.sessionId).toBe('session-1');
    expect(result.participants).toHaveLength(1);
    expect(result.participants[0].displayName).toBe('Alice');
    expect(result.currentLesson.id).toBe('lesson-1');
  });

  it('should join an existing active session if one exists', async () => {
    // No existing participation
    mockPrisma.groupSessionParticipant.findFirst.mockResolvedValue(null);

    // Existing active session found
    mockPrisma.groupSession.findFirst.mockResolvedValue({
      id: 'session-1',
      level: 'A1',
      languageCode: 'lb',
      active: true,
      participants: [
        { user: { id: 'user-2', displayName: 'Bob' } },
      ],
      currentLesson: {
        id: 'lesson-1',
        title: 'Intro',
        curriculum: { skill: 'grammar', level: 'A1' },
      },
    });

    mockPrisma.groupSessionParticipant.create.mockResolvedValue({});

    // Re-fetch after adding participant
    mockPrisma.groupSession.findUnique.mockResolvedValue({
      id: 'session-1',
      level: 'A1',
      languageCode: 'lb',
      active: true,
      participants: [
        { user: { id: 'user-2', displayName: 'Bob' } },
        { user: { id: 'user-1', displayName: 'Alice' } },
      ],
      currentLesson: {
        id: 'lesson-1',
        title: 'Intro',
        curriculum: { skill: 'grammar', level: 'A1' },
      },
    });

    const result = await joinGroupSession('user-1', 'A1', 'lb');

    expect(result.sessionId).toBe('session-1');
    expect(result.participants).toHaveLength(2);
    expect(mockPrisma.groupSessionParticipant.create).toHaveBeenCalledWith({
      data: { sessionId: 'session-1', userId: 'user-1' },
    });
  });

  it('should create a new session when none exists', async () => {
    mockPrisma.groupSessionParticipant.findFirst.mockResolvedValue(null);
    mockPrisma.groupSession.findFirst.mockResolvedValue(null);

    mockPrisma.lesson.findFirst.mockResolvedValue({
      id: 'lesson-1',
      title: 'Intro',
      curriculum: { skill: 'grammar', level: 'A1' },
    });

    mockPrisma.groupSession.create.mockResolvedValue({
      id: 'new-session',
      level: 'A1',
      languageCode: 'lb',
      active: true,
      participants: [
        { user: { id: 'user-1', displayName: 'Alice' } },
      ],
      currentLesson: {
        id: 'lesson-1',
        title: 'Intro',
        curriculum: { skill: 'grammar', level: 'A1' },
      },
    });

    const result = await joinGroupSession('user-1', 'A1', 'lb');

    expect(result.sessionId).toBe('new-session');
    expect(result.participants).toHaveLength(1);
    expect(mockPrisma.groupSession.create).toHaveBeenCalled();
  });

  it('should throw 404 when no lessons are available for the level/language', async () => {
    mockPrisma.groupSessionParticipant.findFirst.mockResolvedValue(null);
    mockPrisma.groupSession.findFirst.mockResolvedValue(null);
    mockPrisma.lesson.findFirst.mockResolvedValue(null);

    try {
      await joinGroupSession('user-1', 'C2', 'lb');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('NO_LESSONS_AVAILABLE');
    }
  });
});

describe('Groups Service - removeParticipant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove participant and keep session active if others remain', async () => {
    mockPrisma.groupSessionParticipant.findFirst.mockResolvedValue({
      id: 'part-1',
      userId: 'user-1',
      sessionId: 'session-1',
    });
    mockPrisma.groupSessionParticipant.delete.mockResolvedValue({});
    mockPrisma.groupSessionParticipant.count.mockResolvedValue(2);

    const result = await removeParticipant('user-1', 'session-1');

    expect(result).toEqual({ userId: 'user-1', sessionId: 'session-1' });
    expect(mockPrisma.groupSession.update).not.toHaveBeenCalled();
  });

  it('should deactivate session when last participant leaves', async () => {
    mockPrisma.groupSessionParticipant.findFirst.mockResolvedValue({
      id: 'part-1',
      userId: 'user-1',
      sessionId: 'session-1',
    });
    mockPrisma.groupSessionParticipant.delete.mockResolvedValue({});
    mockPrisma.groupSessionParticipant.count.mockResolvedValue(0);
    mockPrisma.groupSession.update.mockResolvedValue({});

    const result = await removeParticipant('user-1', 'session-1');

    expect(result).toEqual({ userId: 'user-1', sessionId: 'session-1' });
    expect(mockPrisma.groupSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { active: false },
    });
  });

  it('should return null if participant not found', async () => {
    mockPrisma.groupSessionParticipant.findFirst.mockResolvedValue(null);

    const result = await removeParticipant('user-1', 'session-1');
    expect(result).toBeNull();
  });
});

describe('Groups Service - saveChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist and return a chat message', async () => {
    mockPrisma.groupSession.findUnique.mockResolvedValue({
      id: 'session-1',
      active: true,
    });

    const sentAt = new Date('2024-01-15T10:30:00Z');
    mockPrisma.chatMessage.create.mockResolvedValue({
      id: 'msg-1',
      sessionId: 'session-1',
      userId: 'user-1',
      text: 'Moien!',
      sentAt,
      user: { displayName: 'Alice' },
    });

    const result = await saveChatMessage('session-1', 'user-1', 'Moien!');

    expect(result.userId).toBe('user-1');
    expect(result.displayName).toBe('Alice');
    expect(result.text).toBe('Moien!');
    expect(result.timestamp).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should throw 404 for inactive session', async () => {
    mockPrisma.groupSession.findUnique.mockResolvedValue({
      id: 'session-1',
      active: false,
    });

    try {
      await saveChatMessage('session-1', 'user-1', 'Hello');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
      expect((err as any).code).toBe('SESSION_NOT_FOUND');
    }
  });

  it('should throw 404 for non-existent session', async () => {
    mockPrisma.groupSession.findUnique.mockResolvedValue(null);

    try {
      await saveChatMessage('non-existent', 'user-1', 'Hello');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as any).status).toBe(404);
    }
  });
});

describe('Groups Service - getUserActiveSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return session IDs for active participations', async () => {
    mockPrisma.groupSessionParticipant.findMany.mockResolvedValue([
      { sessionId: 'session-1' },
      { sessionId: 'session-2' },
    ]);

    const result = await getUserActiveSessions('user-1');
    expect(result).toEqual(['session-1', 'session-2']);
  });

  it('should return empty array when user has no active sessions', async () => {
    mockPrisma.groupSessionParticipant.findMany.mockResolvedValue([]);

    const result = await getUserActiveSessions('user-1');
    expect(result).toEqual([]);
  });
});
