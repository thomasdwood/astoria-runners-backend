import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const statusCode = err.statusCode || 500;

  // Log all errors
  console.error(`[${timestamp}] Error:`, {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
  });

  const message = statusCode >= 500 && process.env.NODE_ENV !== 'development'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: message,
  });
}
