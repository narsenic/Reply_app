import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

const VALID_CEFR_LEVELS: string[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Find or create an active group session matching the given level and language.
 * Adds the user as a participant and returns session info.
 */
export async function joinGroupSession(userId: string, level: CEFRLevel, targetLanguage: string) {
  if (!VALID_CEFR_LEVELS.includes(level)) {
    throw new AppError(400, 'INVALID_LEVEL', `Invalid CEFR level: ${level}`);
  }

  // Check if user is already in an active session for this level/language
  const existingParticipation = await prisma.groupSessionParticipant.findFirst({
    where: {
      userId,
      session: {
        active: true,
        level,
        languageCode: targetLanguage,
      },
    },
    include: {
      session: {
        include: {
          participants: { include: { user: true } },
          currentLesson: { include: { curriculum: true } },
        },
      },
    },
  });

  if (existingParticipation) {
    const session = existingParticipation.session;
    return formatSessionResponse(session as any);
  }

  // Find an existing active session matching level and language
  let session = await prisma.groupSession.findFirst({
    where: {
      active: true,
      level,
      languageCode: targetLanguage,
    },
    include: {
      participants: { include: { user: true } },
      currentLesson: { include: { curriculum: true } },
    },
  });

  if (session) {
    // Add user as participant
    await prisma.groupSessionParticipant.create({
      data: {
        sessionId: session.id,
        userId,
      },
    });

    // Re-fetch to include the new participant
    session = await prisma.groupSession.findUnique({
      where: { id: session.id },
      include: {
        participants: { include: { user: true } },
        currentLesson: { include: { curriculum: true } },
      },
    }) as typeof session;
  } else {
    // No active session found — create one with the first lesson at this level/language
    const lesson = await prisma.lesson.findFirst({
      where: {
        curriculum: {
          languageCode: targetLanguage,
          level,
        },
      },
      orderBy: { orderIndex: 'asc' },
      include: { curriculum: true },
    });

    if (!lesson) {
      throw new AppError(404, 'NO_LESSONS_AVAILABLE', `No lessons available for level ${level} in language ${targetLanguage}`);
    }

    session = await prisma.groupSession.create({
      data: {
        languageCode: targetLanguage,
        level,
        currentLessonId: lesson.id,
        active: true,
        participants: {
          create: { userId },
        },
      },
      include: {
        participants: { include: { user: true } },
        currentLesson: { include: { curriculum: true } },
      },
    });
  }

  return formatSessionResponse(session! as any);
}

/**
 * Remove a participant from their active session. If no participants remain, deactivate the session.
 */
export async function removeParticipant(userId: string, sessionId: string) {
  const participant = await prisma.groupSessionParticipant.findFirst({
    where: { userId, sessionId },
  });

  if (!participant) return null;

  await prisma.groupSessionParticipant.delete({
    where: { id: participant.id },
  });

  // Check remaining participants
  const remaining = await prisma.groupSessionParticipant.count({
    where: { sessionId },
  });

  if (remaining === 0) {
    await prisma.groupSession.update({
      where: { id: sessionId },
      data: { active: false },
    });
  }

  return { userId, sessionId };
}

/**
 * Persist a chat message to the database.
 */
export async function saveChatMessage(sessionId: string, userId: string, text: string) {
  const session = await prisma.groupSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || !session.active) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Group session not found or inactive');
  }

  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      userId,
      text,
    },
    include: {
      user: true,
    },
  });

  return {
    userId: message.userId,
    displayName: message.user.displayName,
    text: message.text,
    timestamp: message.sentAt.toISOString(),
  };
}

/**
 * Find all active session IDs for a given user.
 */
export async function getUserActiveSessions(userId: string): Promise<string[]> {
  const participations = await prisma.groupSessionParticipant.findMany({
    where: {
      userId,
      session: { active: true },
    },
    select: { sessionId: true },
  });

  return participations.map((p: { sessionId: string }) => p.sessionId);
}

interface SessionWithRelations {
  id: string;
  participants: Array<{ user: { id: string; displayName: string } }>;
  currentLesson: {
    id: string;
    title: string;
    curriculum: { skill: string; level: string };
  };
}

function formatSessionResponse(session: SessionWithRelations) {
  return {
    sessionId: session.id,
    participants: session.participants.map((p) => ({
      id: p.user.id,
      displayName: p.user.displayName,
    })),
    currentLesson: {
      id: session.currentLesson.id,
      title: session.currentLesson.title,
      skill: session.currentLesson.curriculum.skill,
      level: session.currentLesson.curriculum.level,
    },
  };
}
