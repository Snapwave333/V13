import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform((val) => Number.parseInt(val, 10)),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  JWT_SECRET: z.string().min(10),
  ADMIN_CREDENTIALS_HASH: z.string().optional(),
  REDIS_URL: z.string().optional(),
  BACKEND_URL: z.string().default('ws://127.0.0.1:3000/ws'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _env.data;
