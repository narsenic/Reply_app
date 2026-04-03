import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AppError } from './types/api';
import type { ApiError } from './types/api';
import authRoutes from './modules/auth/auth.routes';
import assessmentRoutes, { userProficiencyRouter } from './modules/assessment/assessment.routes';
import curriculumRoutes from './modules/curriculum/curriculum.routes';
import lessonsRoutes from './modules/lessons/lessons.routes';
import speakingRoutes from './modules/speaking/speaking.routes';
import groupsRoutes from './modules/groups/groups.routes';
import progressRoutes from './modules/progress/progress.routes';
import languagesRoutes, { userLanguageRouter } from './modules/languages/languages.routes';
import { registerGroupSocketHandlers } from './modules/groups/groups.socket';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the built React SPA
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/users', userProficiencyRouter);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/speaking', speakingRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/languages', languagesRoutes);
app.use('/api/users', userLanguageRouter);

// HTTP server + Socket.IO
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Register Socket.IO event handlers for group chat
registerGroupSocketHandlers(io);

// SPA catch-all: serve index.html for any non-API GET request (client-side routing)
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(publicPath, 'index.html');
  try {
    res.sendFile(indexPath);
  } catch {
    res.status(404).json({ message: 'Not found' });
  }
});

// Global error handler — must be after all routes
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    const body: ApiError = err.toJSON();
    return res.status(err.status).json(body);
  }

  console.error('Unhandled error:', err);

  const body: ApiError = {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message || 'An unexpected error occurred',
  };

  return res.status(500).json(body);
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, httpServer, io };
