import dotenv from 'dotenv';

// Load .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Required environment variables
const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'SESSION_SECRET',
] as const;

// Validate all required environment variables
const missingVars: string[] = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Please create a .env file based on .env.example'
  );
}

// Export typed config object
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
  },
  session: {
    secret: process.env.SESSION_SECRET!,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  },
};
