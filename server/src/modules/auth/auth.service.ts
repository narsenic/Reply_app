import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../lib/email';
import { AppError } from '../../types/api';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export async function registerUser(input: RegisterInput) {
  const { email, password, displayName } = input;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_EXISTS', 'A user with this email already exists', {
      email: 'Email is already registered',
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationToken = uuidv4();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      verificationToken,
    },
  });

  // Send verification email (fire-and-forget in background, don't block response)
  sendVerificationEmail(email, verificationToken).catch((err) => {
    console.error('Failed to send verification email:', err);
  });

  return { userId: user.id, message: 'Verification email sent' };
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Check if account is locked
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMs = user.lockoutUntil.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    throw new AppError(423, 'ACCOUNT_LOCKED', `Account is locked. Try again in ${remainingMinutes} minute(s).`);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const updateData: Record<string, unknown> = { failedLoginAttempts: newAttempts };

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Successful login — reset failed attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockoutUntil: null },
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '24h' });

  return {
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName },
  };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) {
    throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
  });

  return { message: 'Email verified successfully' };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent user enumeration
  if (!user) {
    return { message: 'If an account with that email exists, a password reset link has been sent' };
  }

  const resetToken = uuidv4();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  sendPasswordResetEmail(email, resetToken).catch((err) => {
    console.error('Failed to send password reset email:', err);
  });

  return { message: 'If an account with that email exists, a password reset link has been sent' };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return { message: 'Password reset successfully' };
}
