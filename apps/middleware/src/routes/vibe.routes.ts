import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middlewares/auth';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

import { vibeStore } from '../utils/stateStore';

const router = Router();

router.get('/status', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const liveState = vibeStore.getLatest();
  
  const status = {
    vibe_score: liveState?.low_energy ? Math.round(liveState.low_energy * 100) : 0,
    chaos_level: liveState?.glitch_factor ? Math.round(liveState.glitch_factor * 100) : 0,
    active_connections: 1, // This middleware instance
    uptime: process.uptime(),
    user: req.user,
    live_telemetry: liveState || null
  };

  return ApiResponse.success(res, status, 'Vibe status retrieved (Live Telemetry)');
}));

export default router;
