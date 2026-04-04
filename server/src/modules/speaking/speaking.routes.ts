import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { AppError } from '../../types/api';
import {
  evaluateSpeaking,
  recordAttempt,
  selfEvaluate,
  getShadowingExercise,
  recordShadowingAttempt,
} from './speaking.service';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/speaking/evaluate
router.post(
  '/evaluate',
  requireAuth,
  upload.single('audioBlob'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exerciseId = req.body.exerciseId;
      if (!exerciseId || typeof exerciseId !== 'string') {
        throw new AppError(400, 'VALIDATION_ERROR', 'exerciseId is required');
      }
      const result = await evaluateSpeaking(exerciseId, req.file);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/speaking/record
router.post(
  '/record',
  requireAuth,
  upload.single('audioBlob'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exerciseId = req.body.exerciseId;
      if (!exerciseId || typeof exerciseId !== 'string') {
        throw new AppError(400, 'VALIDATION_ERROR', 'exerciseId is required');
      }
      const result = await recordAttempt(req.userId!, exerciseId, req.file);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/speaking/self-evaluate
const selfEvaluateSchema = z.object({
  attemptId: z.string().min(1),
  scores: z.object({
    pronunciation: z.number().int().min(1).max(5),
    fluency: z.number().int().min(1).max(5),
    vocabulary: z.number().int().min(1).max(5),
    grammarAccuracy: z.number().int().min(1).max(5),
  }),
});

router.post(
  '/self-evaluate',
  requireAuth,
  validate({ body: selfEvaluateSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { attemptId, scores } = req.body;
      const result = await selfEvaluate(attemptId, scores);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/speaking/shadowing/:exerciseId
router.get(
  '/shadowing/:exerciseId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getShadowingExercise(req.params.exerciseId as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/speaking/shadowing/:exerciseId/attempt
router.post(
  '/shadowing/:exerciseId/attempt',
  requireAuth,
  upload.single('audioBlob'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const playbackSpeed = parseFloat(req.body.playbackSpeed);
      if (isNaN(playbackSpeed)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'playbackSpeed is required and must be a number');
      }
      const result = await recordShadowingAttempt(
        req.userId!,
        req.params.exerciseId as string,
        req.file,
        playbackSpeed,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
