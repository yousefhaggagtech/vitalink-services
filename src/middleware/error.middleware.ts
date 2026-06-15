import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error, 
  _req: Request, 
  res: Response, 
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  logger.error('Unhandled error occurred in pipeline:', {
    message: err.message,
    stack: err.stack,
    error: err
  });

  return res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    debug: {
      message: err.message,
      stack: err.stack,
    }
  });
};