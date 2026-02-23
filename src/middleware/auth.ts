import { Request, Response, NextFunction } from 'express';

/**
 * Require authenticated user
 * Redirects to /login for browser requests, returns 401 for API requests
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    // Treat as API request if URL starts with /api or Content-Type is JSON
    const isApiRequest =
      req.originalUrl.startsWith('/api/') ||
      req.is('json') ||
      req.headers.accept?.includes('application/json');

    if (isApiRequest) {
      res.status(401).json({
        error: 'Authentication required',
      });
      return;
    }

    // Redirect browser requests to login with return URL
    const redirectUrl = encodeURIComponent(req.originalUrl);
    res.redirect(`/login?redirect=${redirectUrl}`);
    return;
  }

  next();
}

/**
 * Require guest (not authenticated)
 * Redirects authenticated users away from login/register pages
 */
export function requireGuest(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    // Already logged in - redirect to dashboard
    res.redirect('/dashboard');
    return;
  }

  next();
}
