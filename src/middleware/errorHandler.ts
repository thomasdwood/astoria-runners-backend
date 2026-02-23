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

  // Development: include stack trace
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      error: {
        message: err.message,
        stack: err.stack,
        statusCode,
      },
    });
    return;
  }

  // Production: sanitize errors
  if (statusCode >= 500) {
    res.status(statusCode).json({
      error: {
        message: 'Internal server error',
        statusCode,
      },
    });
  } else {
    res.status(statusCode).json({
      error: {
        message: err.message,
        statusCode,
      },
    });
  }
}
