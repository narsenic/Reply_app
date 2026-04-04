import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { getLeaderboard } from './leaderboard.service';

const router = Router();

const leaderboardQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly', 'all_time']).default('all_time'),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

// GET /api/leaderboard?period=weekly|monthly|all_time&limit=50
router.get(
  '/',
  requireAuth,
  validate({ query: leaderboardQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period, limit } = req.query as unknown as {
        period: 'weekly' | 'monthly' | 'all_time';
        limit: number;
      };
      const result = await getLeaderboard(req.userId!, period, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
