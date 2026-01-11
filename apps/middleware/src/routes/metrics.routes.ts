import { Router, Request, Response } from 'express';
import os from 'node:os';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// System and process performance telemetry
const router = Router();

router.get('/metrics', asyncHandler(async (_req: Request, res: Response) => {
  const metrics = {
    uptime: process.uptime(),
    memory: {
      free: os.freemem(),
      total: os.totalmem(),
      usage: 1 - (os.freemem() / os.totalmem())
    },
    cpu: os.loadavg(),
    platform: process.platform,
    timestamp: new Date().toISOString()
  };

  return ApiResponse.success(res, metrics, 'Performance metrics retrieved');
}));

export default router;
