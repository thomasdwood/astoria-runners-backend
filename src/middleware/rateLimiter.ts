import rateLimit from 'express-rate-limit';

/**
 * Public endpoints rate limiter
 * 100 requests per 15 minutes per IP (disabled in development)
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skip: () => process.env.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});

/**
 * Authentication endpoints rate limiter
 * 5 requests per 15 minutes per IP (disabled in development)
 * Successful requests don't count toward limit
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: () => process.env.NODE_ENV === 'development',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later',
});
