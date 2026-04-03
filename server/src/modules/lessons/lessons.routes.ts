import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import {
  getLessonDetail,
  submitExerciseAnswer,
  getLessonTranscript,
} from './lessons.service';

const router = Router();

// GET /api/lessons/:id
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getLessonDetail(req.params.id, req.userId!);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/lessons/:id/transcript
router.get(
  '/:id/transcript',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getLessonTranscript(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/lessons/:id/exercises/:exerciseId/submit
const submitSchema = z.object({
  answer: z.union([z.string(), z.array(z.string())]),
});

router.post(
  '/:id/exercises/:exerciseId/submit',
  requireAuth,
  validate({ body: submitSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await submitExerciseAnswer(
        req.params.id,
        req.params.exerciseId,
        req.body.answer,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
