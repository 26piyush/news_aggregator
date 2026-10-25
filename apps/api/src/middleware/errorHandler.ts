import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      issues: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle generic HTTP errors
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[HTTP ${status}] ${req.method} ${req.originalUrl} - ${message}`);

  // Never leak internal stack traces or connection details in production/API responses
  res.status(status).json({
    error: status === 500 ? 'An unexpected error occurred. Please try again later.' : message,
    statusCode: status,
    timestamp: new Date().toISOString(),
  });
}
