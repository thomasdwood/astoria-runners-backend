import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      // Replace req.query values with parsed (coerced) values
      for (const key of Object.keys(req.query)) {
        delete req.query[key];
      }
      Object.assign(req.query, parsed);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
