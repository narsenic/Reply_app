import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { saveChatMessage, removeParticipant, getUserActiveSessions } from './groups.service';
import { prisma } from '../../lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  displayName?: string;
}

/**
 * Register Socket.IO event handlers for group chat.
 * Authenticates via JWT in handshake auth token.
 * Uses Socket.IO rooms (room = sessionId) for broadcasting.
 */
export function registerGroupSocketHandlers(io: SocketIOServer) {
  // Authentication middleware — verify JWT from handshake
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('Server configuration error'));
    }

    try {
      const decoded = jwt.verify(token, secret) as { userId: string; role: string };
      socket.userId = decoded.userId;

      // Fetch display name
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { displayName: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.displayName = user.displayName;
      next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const displayName = socket.displayName!;

    // Auto-join rooms for all active sessions the user is part of
    const sessionIds = await getUserActiveSessions(userId);
    for (const sessionId of sessionIds) {
      socket.join(sessionId);
      // Notify other participants
      socket.to(sessionId).emit('participant:joined', { userId, displayName });
    }

    // Handle chat:send — client sends a message
    socket.on('chat:send', async (data: { sessionId: string; text: string }) => {
      const { sessionId, text } = data;

      if (!sessionId || !text) return;

      try {
        const broadcast = await saveChatMessage(sessionId, userId, text);

        // Broadcast to all participants in the room (including sender)
        io.in(sessionId).emit('chat:message', broadcast);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle joining a specific session room (after REST join)
    socket.on('session:join', (data: { sessionId: string }) => {
      if (data.sessionId) {
        socket.join(data.sessionId);
        socket.to(data.sessionId).emit('participant:joined', { userId, displayName });
      }
    });

    // Handle disconnect — clean up participant from all active sessions
    socket.on('disconnect', async () => {
      const activeSessions = await getUserActiveSessions(userId);
      for (const sessionId of activeSessions) {
        await removeParticipant(userId, sessionId);
        socket.to(sessionId).emit('participant:left', { userId });
      }
    });
  });
}
