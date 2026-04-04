import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  getAvailablePeers,
  setAvailability,
  sendInvitation,
  acceptInvitation,
  endSession,
} from './peers.service';

const router = Router();

// GET /api/peers/available?level=A2
const availableQuerySchema = z.object({
  level: z.string().optional(),
});

router.get(
  '/available',
  requireAuth,
  validate({ query: availableQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getAvailablePeers(
        req.userId!,
        req.query.level as string | undefined,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/peers/availability
const setAvailabilitySchema = z.object({
  status: z.enum(['available', 'busy', 'offline']),
});

router.put(
  '/availability',
  requireAuth,
  validate({ body: setAvailabilitySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await setAvailability(req.userId!, req.body.status);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/peers/invite
const inviteSchema = z.object({
  targetUserId: z.string().min(1),
});

router.post(
  '/invite',
  requireAuth,
  validate({ body: inviteSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sendInvitation(req.userId!, req.body.targetUserId);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/peers/invite/:id/accept
router.post(
  '/invite/:id/accept',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await acceptInvitation(req.userId!, req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/peers/sessions/:id/end
router.post(
  '/sessions/:id/end',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await endSession(req.userId!, req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
