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


// Seed chapters and lessons on startup if needed
async function seedChaptersOnStartup() {
  try {
    const { prisma } = await import('./lib/prisma');
    
    // Ensure default language
    await prisma.language.upsert({ where: { code: 'lb' }, update: {}, create: { code: 'lb', name: 'Luxembourgish', isDefault: true } });
    
    // Check if chapters already exist
    const chapterCount = await prisma.chapter.count();
    if (chapterCount === 0) {
      const chapters = [
        { title: 'Nationaliteit', description: 'Introducing yourself, nationalities, languages', level: 'A1', orderIndex: 0 },
        { title: 'Gefalen', description: 'Expressing likes, dislikes, and preferences', level: 'A1', orderIndex: 1 },
        { title: 'Weidoen', description: 'Body parts, pain, health vocabulary', level: 'A1', orderIndex: 2 },
        { title: 'Apdikt', description: 'At the pharmacy, buying medicine', level: 'A1', orderIndex: 3 },
        { title: 'An der Stad', description: 'In the city, directions, places', level: 'A1', orderIndex: 4 },
        { title: 'Prepo', description: 'Prepositions of place and movement', level: 'A1', orderIndex: 5 },
        { title: 'An der Stad 2', description: 'More city vocabulary and navigation', level: 'A1', orderIndex: 6 },
        { title: 'Mai Program', description: 'Daily routine, schedule, time', level: 'A1', orderIndex: 7 },
        { title: 'Haus', description: 'Rooms, furniture, home vocabulary', level: 'A1', orderIndex: 8 },
        { title: 'Revisioun', description: 'Revision of chapters 1-9', level: 'A1', orderIndex: 9 },
        { title: 'Perfect mat hunn', description: 'Past tense with hunn (to have)', level: 'A2', orderIndex: 0 },
        { title: 'Perfect mat sinn', description: 'Past tense with sinn (to be)', level: 'A2', orderIndex: 1 },
        { title: 'Vakanz', description: 'Travel, holidays, vacation vocabulary', level: 'A2', orderIndex: 2 },
        { title: 'Imperfect', description: 'Imperfect tense for past events', level: 'A2', orderIndex: 3 },
        { title: 'Kleeder', description: 'Clothing vocabulary and shopping', level: 'A2', orderIndex: 4 },
        { title: 'Verglaich', description: 'Comparing things', level: 'A2', orderIndex: 5 },
        { title: 'Well', description: 'Giving reasons, conjunctions', level: 'A2', orderIndex: 6 },
        { title: 'Wellen', description: 'Modal verbs and expressing desires', level: 'A2', orderIndex: 7 },
        { title: 'Reflexiv Verben 1', description: 'Introduction to reflexive verbs', level: 'A2', orderIndex: 8 },
        { title: 'Reflexiv Verben 2', description: 'Advanced reflexive verb patterns', level: 'A2', orderIndex: 9 },
      ];
      for (const ch of chapters) {
        await prisma.chapter.create({ data: { ...ch, learningPath: 'daily_life', published: true } });
      }
      console.log('Seeded 20 chapters');
    }

    // Ensure every chapter has at least 4 lessons (one per skill) linked via ChapterLesson
    const allChapters = await prisma.chapter.findMany({ orderBy: [{ level: 'asc' }, { orderIndex: 'asc' }] });
    const skills = ['grammar', 'reading', 'listening', 'speaking'] as const;

    for (const chapter of allChapters) {
      const linkCount = await prisma.chapterLesson.count({ where: { chapterId: chapter.id } });
      if (linkCount > 0) continue; // already has lessons

      for (let si = 0; si < skills.length; si++) {
        const skill = skills[si];
        // Ensure curriculum exists
        const currKey = { languageCode: 'lb', level: chapter.level, skill };
        let curriculum = await prisma.curriculum.findUnique({ where: { languageCode_level_skill: currKey } });
        if (!curriculum) {
          curriculum = await prisma.curriculum.create({ data: { ...currKey, title: `${chapter.level} ${skill}` } });
        }

        const lesson = await prisma.lesson.create({
          data: {
            curriculumId: curriculum.id,
            title: `${chapter.title} - ${skill.charAt(0).toUpperCase() + skill.slice(1)}`,
            orderIndex: si,
            content: {
              create: [
                { type: 'text', body: `${skill.charAt(0).toUpperCase() + skill.slice(1)} lesson for "${chapter.title}". ${chapter.description}.`, orderIndex: 0 },
              ],
            },
            exercises: {
              create: [
                { type: skill === 'grammar' ? 'fill-blank' : 'multiple-choice', prompt: `Practice ${skill} for ${chapter.title}`, options: ['Option A', 'Option B', 'Option C'], correctAnswer: 'Option A', explanation: `This is a ${skill} exercise for ${chapter.title}.`, orderIndex: 0 },
              ],
            },
          },
        });

        await prisma.chapterLesson.create({
          data: { chapterId: chapter.id, lessonId: lesson.id, skill, orderIndex: si },
        });
      }
      console.log(`Created lessons for chapter: ${chapter.title}`);
    }

    console.log('Chapter lesson seeding complete');
  } catch (err) {
    console.error('Chapter seed error:', err);
  }
}
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  seedChaptersOnStartup();
});

export { app, httpServer, io };
