import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';
import { listLanguages, addLanguage, switchUserLanguage, setLearningPath } from './languages.service';

const router = Router();

// GET /api/languages — public, no auth required
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listLanguages();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/languages — admin only
const addLanguageSchema = z.object({
  code: z.string().min(2, 'Language code is required (ISO 639-1)').max(10),
  name: z.string().min(1, 'Language name is required'),
});

router.post(
  '/',
  requireAdmin,
  validate({ body: addLanguageSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await addLanguage(req.body.code, req.body.name);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;

// Separate router for user language switch (mounted at /api/users)
const switchLanguageSchema = z.object({
  languageCode: z.string().min(1, 'languageCode is required'),
});

export const userLanguageRouter = Router();

// PUT /api/users/learning-path
const setLearningPathSchema = z.object({
  learningPath: z.enum(['sproochentest', 'daily_life'], {
    errorMap: () => ({ message: 'Learning path must be "sproochentest" or "daily_life"' }),
  }),
});

userLanguageRouter.put(
  '/learning-path',
  requireAuth,
  validate({ body: setLearningPathSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await setLearningPath(req.userId!, req.body.learningPath);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/users/:id/target-language
userLanguageRouter.put(
  '/:id/target-language',
  requireAuth,
  validate({ body: switchLanguageSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await switchUserLanguage(req.params.id as string, req.body.languageCode);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);
