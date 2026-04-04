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
import chaptersRoutes from './modules/chapters/chapters.routes';
import quizzesRoutes from './modules/quizzes/quizzes.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes';
import sproochentestRoutes from './modules/sproochentest/sproochentest.routes';
import peersRoutes from './modules/peers/peers.routes';
import plannerRoutes from './modules/planner/planner.routes';
import { registerGroupSocketHandlers } from './modules/groups/groups.socket';
import { registerPeerSocketHandlers } from './modules/peers/peers.socket';

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
app.use('/api/chapters', chaptersRoutes);
app.use('/api/chapters', quizzesRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/sproochentest', sproochentestRoutes);
app.use('/api/peers', peersRoutes);
app.use('/api/planner', plannerRoutes);

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

// Register Socket.IO event handlers for peer WebRTC signaling
registerPeerSocketHandlers(io);

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


// Seed chapters on startup if none exist
async function seedChaptersOnStartup() {
  try {
    const { prisma } = await import('./lib/prisma');
    
    // Ensure default language
    await prisma.language.upsert({ where: { code: 'lb' }, update: {}, create: { code: 'lb', name: 'Luxembourgish', isDefault: true } });
    
    // Check if chapters already exist
    const count = await prisma.chapter.count();
    if (count > 0) { console.log('Chapters already seeded:', count); return; }
    
    const chapters = [
      { title: 'Nationality', description: 'Introducing yourself, nationalities, languages', level: 'A1', orderIndex: 0 },
      { title: 'Gefalen - Likes', description: 'Expressing preferences and what you enjoy', level: 'A1', orderIndex: 1 },
      { title: 'Weidoen - Health', description: 'Body parts, pain, health vocabulary', level: 'A1', orderIndex: 2 },
      { title: 'Apdikt - Pharmacy', description: 'At the pharmacy, buying medicine', level: 'A1', orderIndex: 3 },
      { title: 'An der Stad', description: 'In the city, directions, places', level: 'A1', orderIndex: 4 },
      { title: 'Prepo - Prepositions', description: 'Spatial relationships and prepositions', level: 'A1', orderIndex: 5 },
      { title: 'An der Stad 2', description: 'More city vocabulary and navigation', level: 'A1', orderIndex: 6 },
      { title: 'Mai Program', description: 'Daily routine, schedule, time', level: 'A1', orderIndex: 7 },
      { title: 'Haus - House', description: 'Rooms, furniture, home vocabulary', level: 'A1', orderIndex: 8 },
      { title: 'Review', description: 'Revision of chapters 1-9', level: 'A1', orderIndex: 9 },
      { title: 'Perfect hunn', description: 'Past tense with hunn (to have)', level: 'A2', orderIndex: 0 },
      { title: 'Perfect sinn', description: 'Past tense with sinn (to be)', level: 'A2', orderIndex: 1 },
      { title: 'Vakanz - Vacation', description: 'Travel, holidays, vacation vocabulary', level: 'A2', orderIndex: 2 },
      { title: 'Imperfect', description: 'Imperfect tense for past events', level: 'A2', orderIndex: 3 },
      { title: 'Kleeder - Clothes', description: 'Clothing vocabulary and shopping', level: 'A2', orderIndex: 4 },
      { title: 'Comparison', description: 'Comparing things', level: 'A2', orderIndex: 5 },
      { title: 'Well - Because', description: 'Giving reasons, conjunctions', level: 'A2', orderIndex: 6 },
      { title: 'Wellen - To want', description: 'Modal verbs and expressing desires', level: 'A2', orderIndex: 7 },
      { title: 'Reflexive Verbs 1', description: 'Introduction to reflexive verbs', level: 'A2', orderIndex: 8 },
      { title: 'Reflexive Verbs 2', description: 'Advanced reflexive verb patterns', level: 'A2', orderIndex: 9 },
    ];
    
    for (const ch of chapters) {
      await prisma.chapter.create({ data: { ...ch, learningPath: 'daily_life', published: true } });
    }
    console.log('Seeded 20 chapters successfully');
  } catch (err) {
    console.error('Chapter seed error:', err);
  }
}
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  seedChaptersOnStartup();
});

export { app, httpServer, io };
