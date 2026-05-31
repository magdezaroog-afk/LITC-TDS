import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '../errors/customErrors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. If it's a known custom application error
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      errorName: err.name,
      message: err.message
    });
  }

  // 2. Log unhandled internal issues
  console.error('[Unhandled System Error]:', err);
  
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    errorName: 'InternalServerError',
    message: 'An unexpected internal server error occurred.'
  });
};
