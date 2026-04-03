import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../types/api';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const details: Record<string, string> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        collectErrors(result.error, details);
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        collectErrors(result.error, details);
      } else {
        (req as any).query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        collectErrors(result.error, details);
      } else {
        (req as any).params = result.data;
      }
    }

    if (Object.keys(details).length > 0) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', details));
    }

    next();
  };
}

function collectErrors(error: ZodError, details: Record<string, string>) {
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    details[path || 'unknown'] = issue.message;
  }
}
