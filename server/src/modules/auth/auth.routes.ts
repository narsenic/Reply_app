import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } from './auth.service';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post(
  '/register',
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registerUser(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginUser(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/verify-email',
  validate({ body: verifyEmailSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await verifyEmail(req.body.token);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await forgotPassword(req.body.email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await resetPassword(req.body.token, req.body.newPassword);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
