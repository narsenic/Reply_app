import { prisma } from '../../lib/prisma';
import { AppError } from '../../types/api';

const INVITATION_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

type AvailabilityStatus = 'available' | 'busy' | 'offline';
const VALID_STATUSES: AvailabilityStatus[] = ['available', 'busy', 'offline'];

/**
 * Get available peers at the same proficiency level.
 */
export async function getAvailablePeers(userId: string, level?: string) {
  const where: any = {
    status: 'available',
    userId: { not: userId },
  };

  // If level provided, filter by user's assessment level
  const peers = await prisma.peerAvailability.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          assessments: {
            orderBy: { completedAt: 'desc' },
            take: 1,
            select: { overallLevel: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  let filtered = peers.map((p) => ({
    userId: p.user.id,
    displayName: p.user.displayName,
    level: p.user.assessments[0]?.overallLevel ?? 'A1',
    availableSince: p.updatedAt.toISOString(),
  }));

  if (level) {
    filtered = filtered.filter((p) => p.level === level);
  }

  return {
    peers: filtered,
    totalAvailable: filtered.length,
  };
}

/**
 * Set user's availability status.
 */
export async function setAvailability(userId: string, status: string) {
  if (!VALID_STATUSES.includes(status as AvailabilityStatus)) {
    throw new AppError(400, 'INVALID_STATUS', `Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const availability = await prisma.peerAvailability.upsert({
    where: { userId },
    create: { userId, status },
    update: { status },
  });

  return { userId, status: availability.status };
}

/**
 * Send a peer session invitation. Creates a pending session with 2-minute expiry.
 */
export async function sendInvitation(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new AppError(400, 'INVALID_INVITATION', 'Cannot invite yourself');
  }

  // Check target is available
  const targetAvailability = await prisma.peerAvailability.findUnique({
    where: { userId: targetUserId },
  });

  if (!targetAvailability || targetAvailability.status !== 'available') {
    throw new AppError(409, 'PEER_NOT_AVAILABLE', 'The selected peer is not currently available');
  }

  // Pick a random speaking prompt for the session
  const prompt = await prisma.speakingPrompt.findFirst({
    orderBy: { id: 'asc' },
  });

  // Create a pending session
  const session = await prisma.peerSession.create({
    data: {
      promptId: prompt?.id ?? null,
      status: 'pending',
    },
  });

  // Add initiator as participant
  await prisma.peerSessionParticipant.create({
    data: {
      sessionId: session.id,
      userId,
      role: 'initiator',
    },
  });

  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

  return {
    invitationId: session.id,
    targetUserId,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Accept a peer session invitation.
 */
export async function acceptInvitation(userId: string, invitationId: string) {
  const session = await prisma.peerSession.findUnique({
    where: { id: invitationId },
    include: {
      participants: true,
      prompt: true,
    },
  });

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Peer session not found');
  }

  if (session.status !== 'pending') {
    throw new AppError(409, 'SESSION_NOT_PENDING', 'This session is no longer pending');
  }

  // Add invitee as participant
  await prisma.peerSessionParticipant.create({
    data: {
      sessionId: session.id,
      userId,
      role: 'invitee',
    },
  });

  // Update session to active
  await prisma.peerSession.update({
    where: { id: session.id },
    data: {
      status: 'active',
      startedAt: new Date(),
    },
  });

  // Set both participants to busy
  const participantIds = [...session.participants.map((p) => p.userId), userId];
  for (const pid of participantIds) {
    await prisma.peerAvailability.upsert({
      where: { userId: pid },
      create: { userId: pid, status: 'busy' },
      update: { status: 'busy' },
    });
  }

  return {
    sessionId: session.id,
    prompt: session.prompt ? {
      id: session.prompt.id,
      topic: session.prompt.topic,
      suggestedVocabulary: session.prompt.suggestedVocabulary,
      guidingQuestions: session.prompt.guidingQuestions,
    } : null,
  };
}

/**
 * End a peer session.
 */
export async function endSession(userId: string, sessionId: string) {
  const session = await prisma.peerSession.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Peer session not found');
  }

  const isParticipant = session.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    throw new AppError(403, 'NOT_PARTICIPANT', 'You are not a participant in this session');
  }

  if (session.status === 'completed') {
    throw new AppError(409, 'SESSION_ALREADY_ENDED', 'This session has already ended');
  }

  await prisma.peerSession.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      endedAt: new Date(),
    },
  });

  // Set participants back to available
  for (const p of session.participants) {
    await prisma.peerAvailability.upsert({
      where: { userId: p.userId },
      create: { userId: p.userId, status: 'available' },
      update: { status: 'available' },
    });
  }

  return { sessionId, status: 'completed' };
}
