import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock prisma before any imports that use it
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock email
vi.mock('../../src/lib/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// Must import after mocks are set up
const { prisma } = await import('../../src/lib/prisma');
const { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } = await import(
  '../../src/modules/auth/auth.service'
);
const { AppError } = await import('../../src/types/api');

const mockPrisma = prisma as any;

describe('Auth Service - registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a user with hashed password and return userId', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'test-user-id' });

    const result = await registerUser({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    expect(result.userId).toBe('test-user-id');
    expect(result.message).toBe('Verification email sent');

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.passwordHash).not.toBe('password123');
    const isValid = await bcrypt.compare('password123', createCall.data.passwordHash);
    expect(isValid).toBe(true);
  });

  it('should generate a verification token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: 'test-user-id' });

    await registerUser({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.verificationToken).toBeDefined();
    expect(typeof createCall.data.verificationToken).toBe('string');
    expect(createCall.data.verificationToken.length).toBeGreaterThan(0);
  });

  it('should throw AppError 409 if email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

    await expect(
      registerUser({
        email: 'existing@example.com',
        password: 'password123',
        displayName: 'Test User',
      })
    ).rejects.toThrow(AppError);

    try {
      await registerUser({
        email: 'existing@example.com',
        password: 'password123',
        displayName: 'Test User',
      });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as InstanceType<typeof AppError>).status).toBe(409);
      expect((err as InstanceType<typeof AppError>).code).toBe('EMAIL_EXISTS');
    }
  });
});

describe('Auth Service - loginUser', () => {
  const validHash = bcrypt.hashSync('password123', 10);
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: validHash,
    displayName: 'Test User',
    role: 'USER',
    failedLoginAttempts: 0,
    lockoutUntil: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  it('should return a JWT token and user info on successful login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await loginUser({ email: 'test@example.com', password: 'password123' });

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.displayName).toBe('Test User');

    // Verify JWT payload
    const decoded = jwt.verify(result.token, 'test-secret-key') as any;
    expect(decoded.userId).toBe('user-1');
    expect(decoded.role).toBe('USER');
  });

  it('should reset failedLoginAttempts on successful login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, failedLoginAttempts: 2 });
    mockPrisma.user.update.mockResolvedValue({});

    await loginUser({ email: 'test@example.com', password: 'password123' });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });
  });

  it('should throw 401 with generic message for wrong email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    try {
      await loginUser({ email: 'wrong@example.com', password: 'password123' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as InstanceType<typeof AppError>).status).toBe(401);
      expect((err as InstanceType<typeof AppError>).code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('should throw 401 with generic message for wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser });
    mockPrisma.user.update.mockResolvedValue({});

    try {
      await loginUser({ email: 'test@example.com', password: 'wrongpassword' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as InstanceType<typeof AppError>).status).toBe(401);
      expect((err as InstanceType<typeof AppError>).code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('should increment failedLoginAttempts on wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, failedLoginAttempts: 1 });
    mockPrisma.user.update.mockResolvedValue({});

    try {
      await loginUser({ email: 'test@example.com', password: 'wrongpassword' });
    } catch {
      // expected
    }

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { failedLoginAttempts: 2 },
    });
  });

  it('should lock account after 3 consecutive failed attempts', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, failedLoginAttempts: 2 });
    mockPrisma.user.update.mockResolvedValue({});

    try {
      await loginUser({ email: 'test@example.com', password: 'wrongpassword' });
    } catch {
      // expected
    }

    const updateCall = mockPrisma.user.update.mock.calls[0][0];
    expect(updateCall.data.failedLoginAttempts).toBe(3);
    expect(updateCall.data.lockoutUntil).toBeDefined();
    expect(updateCall.data.lockoutUntil instanceof Date).toBe(true);
  });

  it('should throw 423 when account is locked', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, lockoutUntil: futureDate });

    try {
      await loginUser({ email: 'test@example.com', password: 'password123' });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as InstanceType<typeof AppError>).status).toBe(423);
      expect((err as InstanceType<typeof AppError>).code).toBe('ACCOUNT_LOCKED');
    }
  });
});

describe('Auth Service - verifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify email and clear verification token', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', verificationToken: 'valid-token' });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await verifyEmail('valid-token');

    expect(result.message).toBe('Email verified successfully');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { emailVerified: true, verificationToken: null },
    });
  });

  it('should throw 400 for invalid verification token', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    try {
      await verifyEmail('invalid-token');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as InstanceType<typeof AppError>).status).toBe(400);
      expect((err as InstanceType<typeof AppError>).code).toBe('INVALID_TOKEN');
    }
  });
});

describe('Auth Service - forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate reset token for existing user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await forgotPassword('test@example.com');

    expect(result.message).toContain('password reset link has been sent');
    const updateCall = mockPrisma.user.update.mock.calls[0][0];
    expect(updateCall.data.resetToken).toBeDefined();
    expect(updateCall.data.resetTokenExpiry).toBeDefined();
    expect(updateCall.data.resetTokenExpiry instanceof Date).toBe(true);
  });

  it('should return same message for non-existent email (no enumeration)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await forgotPassword('nonexistent@example.com');

    expect(result.message).toContain('password reset link has been sent');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});

describe('Auth Service - resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset password with valid token', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      resetToken: 'valid-token',
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await resetPassword('valid-token', 'newpassword123');

    expect(result.message).toBe('Password reset successfully');
    const updateCall = mockPrisma.user.update.mock.calls[0][0];
    expect(updateCall.data.resetToken).toBeNull();
    expect(updateCall.data.resetTokenExpiry).toBeNull();
    // Verify new password is hashed
    const isValid = await bcrypt.compare('newpassword123', updateCall.data.passwordHash);
    expect(isValid).toBe(true);
  });

  it('should throw 400 for invalid or expired reset token', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    try {
      await resetPassword('invalid-token', 'newpassword123');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as InstanceType<typeof AppError>).status).toBe(400);
      expect((err as InstanceType<typeof AppError>).code).toBe('INVALID_TOKEN');
    }
  });
});
