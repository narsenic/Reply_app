import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import { getQuiz, submitQuiz, getQuizHistory } from './quizzes.service';

const router = Router();

// --- Validation Schemas ---

const quizSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid('Invalid question ID'),
        answer: z.string().min(1, 'Answer is required'),
      }),
    )
    .min(1, 'At least one answer is required'),
});

// --- Routes ---

// GET /api/chapters/:chapterId/quiz
router.get(
  '/:chapterId/quiz',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getQuiz(req.userId!, req.params.chapterId as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/chapters/:chapterId/quiz/submit
router.post(
  '/:chapterId/quiz/submit',
  requireAuth,
  validate({ body: quizSubmitSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await submitQuiz(
        req.userId!,
        req.params.chapterId as string,
        req.body.answers,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/chapters/:chapterId/quiz/results
router.get(
  '/:chapterId/quiz/results',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getQuizHistory(req.userId!, req.params.chapterId as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
