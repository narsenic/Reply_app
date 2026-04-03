import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { startAssessment, submitAssessment, selfSelectLevel } from './assessment.service';

const router = Router();

// POST /api/assessments/start
router.post(
  '/start',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = startAssessment(req.userId!);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/assessments/:id/submit
const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, 'questionId is required'),
      answer: z.string().min(1, 'answer is required'),
    }),
  ),
});

router.post(
  '/:id/submit',
  requireAuth,
  validate({ body: submitSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await submitAssessment(
        req.params.id,
        req.userId!,
        req.body.answers,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

// Separate router for user proficiency route (mounted at /api/users)
const selfSelectSchema = z.object({
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
    errorMap: () => ({ message: 'Level must be one of: A1, A2, B1, B2, C1, C2' }),
  }),
});

export const userProficiencyRouter = Router();

// PUT /api/users/:id/proficiency
userProficiencyRouter.put(
  '/:id/proficiency',
  requireAuth,
  validate({ body: selfSelectSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await selfSelectLevel(req.params.id, req.body.level);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);
