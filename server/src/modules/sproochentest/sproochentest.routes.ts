import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  getTopicCards,
  getMockExam,
  submitMockExam,
  getTimedPractice,
} from './sproochentest.service';

const router = Router();

// GET /api/sproochentest/topic-cards?level=A2
const topicCardsQuerySchema = z.object({
  level: z.string().min(1, 'Level is required'),
});

router.get(
  '/topic-cards',
  requireAuth,
  validate({ query: topicCardsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getTopicCards(req.query.level as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/sproochentest/mock-exam?level=A2
const mockExamQuerySchema = z.object({
  level: z.string().min(1, 'Level is required'),
});

router.get(
  '/mock-exam',
  requireAuth,
  validate({ query: mockExamQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getMockExam(req.query.level as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/sproochentest/mock-exam/submit
const submitMockExamSchema = z.object({
  oralProductionScore: z.number().min(0).max(100),
  listeningAnswers: z.array(z.object({
    questionId: z.string().min(1),
    answer: z.string(),
  })),
});

router.post(
  '/mock-exam/submit',
  requireAuth,
  validate({ body: submitMockExamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await submitMockExam(req.userId!, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/sproochentest/timed-practice?level=A2&section=oral_production
const timedPracticeQuerySchema = z.object({
  level: z.string().min(1, 'Level is required'),
  section: z.enum(['oral_production', 'listening_comprehension']),
});

router.get(
  '/timed-practice',
  requireAuth,
  validate({ query: timedPracticeQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getTimedPractice(
        req.query.level as string,
        req.query.section as 'oral_production' | 'listening_comprehension',
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
