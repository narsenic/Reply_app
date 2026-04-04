import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { getSummary, getXPHistory, getBadges, getStreak } from './gamification.service';

const router = Router();

// GET /api/gamification/summary
router.get(
  '/summary',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getSummary(req.userId!);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/gamification/xp/history?page=&limit=
const xpHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  '/xp/history',
  requireAuth,
  validate({ query: xpHistoryQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await getXPHistory(req.userId!, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/gamification/badges
router.get(
  '/badges',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getBadges(req.userId!);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/gamification/streak
router.get(
  '/streak',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getStreak(req.userId!);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
