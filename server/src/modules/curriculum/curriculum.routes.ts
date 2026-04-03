import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { validate } from '../../middleware/validate';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';
import { uploadToS3 } from '../../lib/s3';
import { AppError } from '../../types/api';
import {
  listCurriculum,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  VALID_CEFR_LEVELS,
  VALID_SKILLS,
} from './curriculum.service';

const router = Router();

// Accepted MIME types for curriculum uploads
const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'text/plain',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          400,
          'UNSUPPORTED_FILE_FORMAT',
          `Unsupported file format: ${file.mimetype}. Accepted formats: PDF, MP3, WAV, MP4, plain text.`,
        ) as any,
      );
    }
  },
});

// POST /api/curriculum/upload (Admin only, multipart)
router.post(
  '/upload',
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'FILE_REQUIRED', 'No file provided in the request');
      }

      const { fileUrl, fileType } = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );

      res.status(200).json({ fileUrl, fileType });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/curriculum?language=lb&level=A1&skill=grammar
const listQuerySchema = z.object({
  language: z.string().optional(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  skill: z.enum(['grammar', 'reading', 'listening', 'speaking']).optional(),
});

router.get(
  '/',
  requireAuth,
  validate({ query: listQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listCurriculum({
        language: req.query.language as string | undefined,
        level: req.query.level as string | undefined,
        skill: req.query.skill as string | undefined,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/curriculum/lessons (Admin only)
const contentBlockSchema = z.object({
  type: z.string().min(1, 'Content block type is required'),
  body: z.string().optional(),
  fileUrl: z.string().optional(),
  orderIndex: z.number().int().min(0),
});

const createLessonSchema = z.object({
  targetLanguage: z.string().min(1, 'Target language is required'),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
    errorMap: () => ({ message: `Level must be one of: ${VALID_CEFR_LEVELS.join(', ')}` }),
  }),
  skill: z.enum(['grammar', 'reading', 'listening', 'speaking'], {
    errorMap: () => ({ message: `Skill must be one of: ${VALID_SKILLS.join(', ')}` }),
  }),
  title: z.string().min(1, 'Title is required'),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  content: z.array(contentBlockSchema).default([]),
});

router.post(
  '/lessons',
  requireAdmin,
  validate({ body: createLessonSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lesson = await createLesson(req.body);
      res.status(201).json(lesson);
    } catch (err) {
      next(err);
    }
  },
);


// PUT /api/curriculum/lessons/reorder (Admin only) — must be before :id route
const reorderSchema = z.object({
  lessonIds: z.array(z.string().min(1)).min(1, 'At least one lesson ID is required'),
});

router.put(
  '/lessons/reorder',
  requireAdmin,
  validate({ body: reorderSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await reorderLessons(req.body.lessonIds);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/curriculum/lessons/:id (Admin only)
const updateLessonSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  content: z.array(contentBlockSchema).optional(),
});

router.put(
  '/lessons/:id',
  requireAdmin,
  validate({ body: updateLessonSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lesson = await updateLesson(req.params.id as string, req.body);
      res.status(200).json(lesson);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/curriculum/lessons/:id (Admin only)
router.delete(
  '/lessons/:id',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deleteLesson(req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
