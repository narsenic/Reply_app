import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { getDashboard, getProgressHistory, completeLesson } from './progress.service';

const router = Router();

// GET /api/progress/dashboard
router.get(
  '/dashboard',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getDashboard(req.userId!);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/progress/history?page=1&limit=20
const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/history',
  requireAuth,
  validate({ query: historyQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await getProgressHistory(req.userId!, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/progress/complete
const completeSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
  score: z.number().int().min(0).max(100),
});

router.post(
  '/complete',
  requireAuth,
  validate({ body: completeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lessonId, score } = req.body;
      const result = await completeLesson(req.userId!, lessonId, score);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
