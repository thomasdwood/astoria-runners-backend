import session from 'express-session';
import RedisStore from 'connect-redis';
import { Redis } from 'ioredis';
import { config } from './env.js';

// Create Redis client
const redisClient = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

// Handle Redis connection errors gracefully
redisClient.on('error', (err: Error) => {
  console.error('Redis connection error:', err.message);
  // Don't crash - session will work but won't persist across restarts
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

// Configure session middleware
export const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'astoria:sess:',
  }),
  secret: config.session.secret,
  name: 'sid', // Security: Don't use default 'connect.sid'
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS access
    sameSite: 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
