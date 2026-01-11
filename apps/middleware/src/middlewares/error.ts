import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (err instanceof ZodError) {
    logger.warn('Validation Error', { errors: err.errors, path: req.path });
    return res.status(400).json({
      status: 'error',
      message: 'Validation Failure',
      errors: err.errors
    });
  }

  // Log strict internal errors
  if (statusCode === 500) {
    logger.error('CRITICAL ERROR', { 
        error: message, 
        stack: err.stack,
        url: req.url,
        method: req.method
    });
  } else {
    logger.warn('Operational Error', { error: message, statusCode });
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
