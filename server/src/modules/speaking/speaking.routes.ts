import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.middleware';
import { AppError } from '../../types/api';
import { evaluateSpeaking } from './speaking.service';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

export default router;
