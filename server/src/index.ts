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

    let chaptersNeedingLessons = 0;
    for (const chapter of allChapters) {
      const linkCount = await prisma.chapterLesson.count({ where: { chapterId: chapter.id } });
      if (linkCount === 0) {
        chaptersNeedingLessons++;
      } else {
        // Check if existing lessons are placeholders (have "Option A" as correct answer)
        const links = await prisma.chapterLesson.findMany({ where: { chapterId: chapter.id }, include: { lesson: { include: { exercises: true } } } });
        const isPlaceholder = links.some(l => l.lesson.exercises.some(e => e.correctAnswer === 'Option A'));
        if (isPlaceholder) {
          // Delete placeholder lessons and their links
          for (const link of links) {
            await prisma.exercise.deleteMany({ where: { lessonId: link.lessonId } });
            await prisma.contentBlock.deleteMany({ where: { lessonId: link.lessonId } });
            await prisma.userProgress.deleteMany({ where: { lessonId: link.lessonId } });
          }
          await prisma.chapterLesson.deleteMany({ where: { chapterId: chapter.id } });
          for (const link of links) {
            await prisma.lesson.delete({ where: { id: link.lessonId } }).catch(() => {});
          }
          chaptersNeedingLessons++;
          console.log(`Removed placeholder lessons for: ${chapter.title}`);
        }
      }
    }

    if (chaptersNeedingLessons > 0) {
      console.log(`${chaptersNeedingLessons} chapters need lessons — creating from built-in content...`);
      
      // Chapter content definitions with real Luxembourgish material
      const chapterContent: Record<number, Record<string, { title: string; content: string; exercises: Array<{ type: string; prompt: string; options: string[] | null; correctAnswer: string; explanation: string }> }>> = {
        0: { // Nationaliteit
          grammar: {
            title: 'Nationality Grammar',
            content: '<h3>Ech sinn... -- I am...</h3><p>To state your nationality in Luxembourgish, use <strong>Ech sinn</strong> followed by the nationality adjective.</p><ul><li><strong>Ech sinn Letzebuerger/Letzebuergesch.</strong> -- I am Luxembourgish (m/f).</li><li><strong>Ech sinn Franseisch.</strong> -- I am French.</li><li><strong>Ech sinn Daeitsch.</strong> -- I am German.</li></ul><p>To ask: <strong>Wat bass du vun Nationaliteit?</strong></p>',
            exercises: [
              { type: 'multiple-choice', prompt: "How do you say 'I am Luxembourgish' (male)?", options: ['Ech sinn Letzebuerger', 'Ech sinn Franseisch', 'Ech sinn Portugisesch', 'Ech sinn Belsch'], correctAnswer: 'Ech sinn Letzebuerger', explanation: 'Letzebuerger is the masculine nationality adjective.' },
              { type: 'fill-blank', prompt: 'Complete: Ech ___ Franseisch. (I am French.)', options: null, correctAnswer: 'sinn', explanation: 'Ech sinn = I am.' },
            ],
          },
          reading: {
            title: 'At the Embassy',
            content: '<h3>Op der Ambassade</h3><p><strong>Beamten:</strong> Moien! Wei heescht Dir?</p><p><strong>Maria:</strong> Ech heeschen Maria. Ech sinn Portugisesch.</p><p><strong>Beamten:</strong> Schwatzt Dir Letzebuergesch?</p><p><strong>Maria:</strong> Jo, e bessen.</p><hr/><p><em>Vocabulary: Beamten = official, Ambassade = embassy, e bessen = a little</em></p>',
            exercises: [
              { type: 'multiple-choice', prompt: "What is Maria's nationality?", options: ['Luxembourgish', 'French', 'Portuguese', 'German'], correctAnswer: 'Portuguese', explanation: "Maria says 'Ech sinn Portugisesch'." },
              { type: 'multiple-choice', prompt: 'Does Maria speak Luxembourgish?', options: ['No', 'Yes, a little', 'Yes, fluently', 'She speaks French'], correctAnswer: 'Yes, a little', explanation: "Maria says 'Jo, e bessen' -- Yes, a little." },
            ],
          },
          listening: {
            title: 'Introductions',
            content: '<h3>Sech virstellen -- Introducing oneself</h3><p>Moien! Ech heeschen Tom. Ech sinn Daeitsch, mee ech wunnen zu Letzebuerg. Ech schaffen als Ingenieur. Ech schwatzen Daeitsch, Franseisch an e bessen Letzebuergesch.</p><hr/><p><em>Vocabulary: mee = but, schaffen = to work, als = as, Ingenieur = engineer</em></p>',
            exercises: [
              { type: 'multiple-choice', prompt: "What is Tom's nationality?", options: ['Luxembourgish', 'French', 'German', 'Belgian'], correctAnswer: 'German', explanation: "Tom says 'Ech sinn Daeitsch'." },
              { type: 'multiple-choice', prompt: "What is Tom's profession?", options: ['Teacher', 'Doctor', 'Engineer', 'Chef'], correctAnswer: 'Engineer', explanation: "'Ech schaffen als Ingenieur' = I work as an engineer." },
            ],
          },
          speaking: {
            title: 'Introduce Yourself',
            content: '<h3>Stell dech vir!</h3><p>Use these patterns:</p><ul><li><strong>Moien! Ech heeschen...</strong> (Hello! My name is...)</li><li><strong>Ech sinn...</strong> (I am... [nationality])</li><li><strong>Ech wunnen zu...</strong> (I live in...)</li><li><strong>Ech schwatzen...</strong> (I speak...)</li></ul>',
            exercises: [
              { type: 'multiple-choice', prompt: "How do you say 'I live in Luxembourg'?", options: ['Ech wunnen zu Letzebuerg', 'Ech schaffen zu Letzebuerg', 'Ech sinn zu Letzebuerg', 'Ech heeschen Letzebuerg'], correctAnswer: 'Ech wunnen zu Letzebuerg', explanation: 'Wunnen = to live.' },
            ],
          },
        },
      };

      for (const chapter of allChapters) {
        const linkCount = await prisma.chapterLesson.count({ where: { chapterId: chapter.id } });
        if (linkCount > 0) continue;

        const content = chapterContent[chapter.orderIndex];

        for (let si = 0; si < skills.length; si++) {
          const skill = skills[si];
          const currKey = { languageCode: 'lb', level: chapter.level, skill };
          let curriculum = await prisma.curriculum.findUnique({ where: { languageCode_level_skill: currKey } });
          if (!curriculum) {
            curriculum = await prisma.curriculum.create({ data: { ...currKey, title: `${chapter.level} ${skill}` } });
          }

          const skillContent = content?.[skill];
          const lessonTitle = skillContent?.title || `${chapter.title} - ${skill.charAt(0).toUpperCase() + skill.slice(1)}`;
          const bodyText = skillContent?.content || `<h3>${chapter.title} - ${skill.charAt(0).toUpperCase() + skill.slice(1)}</h3><p>${chapter.description}</p><p>Practice ${skill} skills for this chapter topic.</p>`;
          const exerciseDefs = skillContent?.exercises || [
            { type: 'multiple-choice', prompt: `What is the topic of this chapter?`, options: [chapter.title, 'Greetings', 'Numbers', 'Colors'], correctAnswer: chapter.title, explanation: `This chapter covers: ${chapter.description}` },
          ];

          const lesson = await prisma.lesson.create({
            data: {
              curriculumId: curriculum.id,
              title: lessonTitle,
              orderIndex: si,
              content: { create: [{ type: 'text', body: bodyText, orderIndex: 0 }] },
              exercises: {
                create: exerciseDefs.map((e, ei) => ({
                  type: e.type,
                  prompt: e.prompt,
                  options: e.options || [],
                  correctAnswer: e.correctAnswer,
                  explanation: e.explanation,
                  orderIndex: ei,
                })),
              },
            },
          });

          await prisma.chapterLesson.create({
            data: { chapterId: chapter.id, lessonId: lesson.id, skill, orderIndex: si },
          });
        }
        console.log(`Created lessons for: ${chapter.title}`);
      }
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
