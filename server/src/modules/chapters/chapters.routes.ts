import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';
import {
  listChapters,
  getChapterDetail,
  createChapter,
  updateChapter,
  deleteChapter,
  getPromptsByChapter,
  createPrompt,
} from './chapters.service';

const router = Router();

// --- Validation Schemas ---

const listQuerySchema = z.object({
  level: z.string().min(1, 'Level is required'),
  path: z.string().min(1, 'Learning path is required'),
});

const createChapterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  level: z.string().min(1, 'Level is required'),
  learningPath: z.enum(['sproochentest', 'daily_life'], {
    errorMap: () => ({ message: 'Learning path must be sproochentest or daily_life' }),
  }),
  orderIndex: z.number().int().min(0, 'Order index must be a non-negative integer'),
});

const updateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  level: z.string().min(1).optional(),
  learningPath: z.enum(['sproochentest', 'daily_life']).optional(),
  orderIndex: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

// --- Routes ---

// GET /api/chapters?level=A1&path=sproochentest
router.get(
  '/',
  requireAuth,
  validate({ query: listQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listChapters(
        req.userId!,
        req.query.level as string,
        req.query.path as string,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/chapters/:id
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getChapterDetail(req.userId!, req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/chapters (admin)
router.post(
  '/',
  requireAdmin,
  validate({ body: createChapterSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chapter = await createChapter(req.body);
      res.status(201).json(chapter);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/chapters/:id (admin)
router.put(
  '/:id',
  requireAdmin,
  validate({ body: updateChapterSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const chapter = await updateChapter(req.params.id as string, req.body);
      res.status(200).json(chapter);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/chapters/:id (admin)
router.delete(
  '/:id',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deleteChapter(req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// --- Speaking Prompts ---

// GET /api/chapters/:chapterId/prompts
router.get(
  '/:chapterId/prompts',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getPromptsByChapter(req.params.chapterId as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

const createPromptSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  suggestedVocabulary: z.string().min(1, 'Suggested vocabulary is required'),
  guidingQuestions: z.array(z.string().min(1)).min(1, 'At least one guiding question is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  learningPath: z.enum(['sproochentest', 'daily_life']),
});

// POST /api/chapters/:chapterId/prompts (admin)
router.post(
  '/:chapterId/prompts',
  requireAdmin,
  validate({ body: createPromptSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createPrompt(req.params.chapterId as string, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
