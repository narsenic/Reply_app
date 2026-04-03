import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin } from '../../src/middleware/auth.middleware';
import { AppError } from '../../src/types/api';

const TEST_SECRET = 'test-jwt-secret';

function mockReqResNext() {
  const req = { headers: {} } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should attach userId and userRole for a valid token', () => {
    const token = jwt.sign({ userId: 'u1', role: 'USER' }, TEST_SECRET, { expiresIn: '1h' });
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.userId).toBe('u1');
    expect(req.userRole).toBe('USER');
  });

  it('should return 401 when no authorization header is present', () => {
    const { req, res, next } = mockReqResNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = 'Basic abc123';

    requireAuth(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 with TOKEN_EXPIRED for an expired token', () => {
    const token = jwt.sign({ userId: 'u1', role: 'USER' }, TEST_SECRET, { expiresIn: '-1s' });
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    requireAuth(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
    expect(err.code).toBe('TOKEN_EXPIRED');
  });

  it('should return 401 with INVALID_TOKEN for a malformed token', () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = 'Bearer not-a-real-jwt';

    requireAuth(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
    expect(err.code).toBe('INVALID_TOKEN');
  });

  it('should return 401 with INVALID_TOKEN for a token signed with wrong secret', () => {
    const token = jwt.sign({ userId: 'u1', role: 'USER' }, 'wrong-secret');
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    requireAuth(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
    expect(err.code).toBe('INVALID_TOKEN');
  });
});

describe('requireAdmin middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should call next() for a valid admin token', () => {
    const token = jwt.sign({ userId: 'a1', role: 'ADMIN' }, TEST_SECRET, { expiresIn: '1h' });
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.userId).toBe('a1');
    expect(req.userRole).toBe('ADMIN');
  });

  it('should return 403 for a non-admin user', () => {
    const token = jwt.sign({ userId: 'u1', role: 'USER' }, TEST_SECRET, { expiresIn: '1h' });
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = `Bearer ${token}`;

    requireAdmin(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('should return 401 when no token is provided (delegates to requireAuth)', () => {
    const { req, res, next } = mockReqResNext();

    requireAdmin(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(401);
  });
});
