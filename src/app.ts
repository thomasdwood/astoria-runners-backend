import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { sessionMiddleware } from './config/session.js';
import { publicLimiter, authLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import calendarRouter from './routes/calendar.js';
import routesRouter from './routes/routes.js';
import eventsRouter from './routes/events.js';
import recurringTemplatesRouter from './routes/recurringTemplates.js';
import categoriesRouter from './routes/categories.js';
import hostsRouter from './routes/hosts.js';
import settingsRouter from './routes/settings.js';

export const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(sessionMiddleware);

// Global rate limiter
app.use(publicLimiter);

// Routes
app.use('/auth', authLimiter, authRouter); // Auth routes with strict rate limit
app.use('/calendar', calendarRouter); // Public calendar - NO auth required
app.use('/api/categories', categoriesRouter); // Category management - public GET, auth mutations
app.use('/api/hosts', hostsRouter); // Host management - public GET, auth mutations
app.use('/api/settings', settingsRouter); // Settings management - public GET, auth PUT
app.use('/api/routes', routesRouter); // Route management - auth required (handled in router)
app.use('/api/events', eventsRouter); // Event management - auth required (handled in router)
app.use('/api/recurring-templates', recurringTemplatesRouter); // Recurring template management - auth required (handled in router)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Serve client build in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Error handler must be last
app.use(errorHandler);
