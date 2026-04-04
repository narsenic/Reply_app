import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  displayName?: string;
}

/**
 * Register Socket.IO event handlers for peer-to-peer WebRTC signaling.
 */
export function registerPeerSocketHandlers(io: SocketIOServer) {
  // Namespace for peer signaling (reuses the same auth middleware from groups)
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    // Handle WebRTC signaling relay
    socket.on('peer:signal', async (data: {
      sessionId: string;
      signal: any;
      type: 'offer' | 'answer' | 'ice-candidate';
    }) => {
      const { sessionId, signal, type } = data;
      if (!sessionId || !signal || !type) return;

      try {
        // Verify user is a participant
        const participant = await prisma.peerSessionParticipant.findFirst({
          where: { sessionId, userId },
        });
        if (!participant) return;

        // Get the other participant
        const otherParticipant = await prisma.peerSessionParticipant.findFirst({
          where: { sessionId, userId: { not: userId } },
        });
        if (!otherParticipant) return;

        // Relay signal to the other participant's room
        socket.to(`peer:${otherParticipant.userId}`).emit('peer:signal', {
          sessionId,
          signal,
          type,
          fromUserId: userId,
        });
      } catch {
        socket.emit('error', { message: 'Failed to relay signal' });
      }
    });

    // Join personal peer room for receiving signals
    socket.join(`peer:${userId}`);

    // Handle peer invitation notification (server emits this after REST invite)
    socket.on('peer:join-session', (data: { sessionId: string }) => {
      if (data.sessionId) {
        socket.join(`peer-session:${data.sessionId}`);
      }
    });
  });
}

/**
 * Emit peer invitation to target user via Socket.IO.
 */
export function emitPeerInvitation(
  io: SocketIOServer,
  targetUserId: string,
  invitation: {
    invitationId: string;
    fromUserId: string;
    fromDisplayName: string;
    prompt?: any;
  },
) {
  io.to(`peer:${targetUserId}`).emit('peer:invitation', invitation);
}

/**
 * Emit session started to both participants.
 */
export function emitSessionStarted(
  io: SocketIOServer,
  participantUserIds: string[],
  session: {
    sessionId: string;
    prompt?: any;
  },
) {
  for (const uid of participantUserIds) {
    const peerIds = participantUserIds.filter((id) => id !== uid);
    io.to(`peer:${uid}`).emit('peer:session-started', {
      sessionId: session.sessionId,
      peerId: peerIds[0],
      prompt: session.prompt,
    });
  }
}

/**
 * Emit session ended to all participants.
 */
export function emitSessionEnded(
  io: SocketIOServer,
  participantUserIds: string[],
  sessionId: string,
) {
  for (const uid of participantUserIds) {
    io.to(`peer:${uid}`).emit('peer:session-ended', { sessionId });
  }
}
