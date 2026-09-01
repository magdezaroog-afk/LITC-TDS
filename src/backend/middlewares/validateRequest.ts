import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { Logger } from '../infrastructure/Logger';

/**
 * Middleware to validate the request body against a provided Zod schema.
 */
export const validateRequest = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as any;
        Logger.warn(`[Validation Error] on ${req.originalUrl}: ${JSON.stringify(zodError.errors)}`);
        res.status(400).json({
          error: 'Validation failed',
          details: zodError.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        Logger.error(`[Validation Error] Unexpected error during validation: ${error}`);
        res.status(500).json({ error: 'Internal Server Error during validation' });
      }
    }
  };
};
