// src/config/env.ts
import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    REDIS_URL: z.string().optional(),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    HOLD_TTL_SECONDS: z.string().default('600'), // 10 minutes
    HOLD_CLEANUP_INTERVAL: z.string().default('60000'), // 1 minute
});
export const env = envSchema.parse(process.env);
