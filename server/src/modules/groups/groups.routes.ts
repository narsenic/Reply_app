import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { joinGroupSession } from './groups.service';
import type { CEFRLevel } from './groups.service';

const router = Router();

const joinSchema = z.object({
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  targetLanguage: z.string().min(1),
});

// POST /api/groups/join
router.post(
  '/join',
  requireAuth,
  validate({ body: joinSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { level, targetLanguage } = req.body as { level: CEFRLevel; targetLanguage: string };
      const result = await joinGroupSession(req.userId!, level, targetLanguage);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
