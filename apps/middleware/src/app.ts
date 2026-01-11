import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middlewares/error';
import { ApiResponse } from './utils/apiResponse';
import { apiLimiter } from './middlewares/rateLimiter';
import { logger } from './utils/logger';

const app: Express = express();

import routes from './routes';

// Request Logger
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Security & Optimization Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(apiLimiter);

app.use('/api/v1', routes);

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  ApiResponse.success(res, { timestamp: new Date().toISOString() }, 'System Operational');
});

// 404 Handler
app.use((_req: Request, _res: Response, next: import('express').NextFunction) => {
  next(new Error('Route not found')); // Or custom AppError if we had one, but Error works with our handler
});

// Global Error Handler
app.use(errorHandler);

export default app;
