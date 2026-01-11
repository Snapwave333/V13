import { Router, Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// In-memory store for the latest visual metrics
let latestVisualMetrics = {
    fps: 0,
    resolution: '0x0',
    timestamp: new Date().toISOString()
};

/**
 * @route POST /api/v1/telemetry/visual
 * @desc Receive visual performance data from the frontend
 */
router.post('/visual', asyncHandler(async (req: Request, res: Response) => {
    const { fps, resolution } = req.body;
    
    latestVisualMetrics = {
        fps: fps || 0,
        resolution: resolution || '0x0',
        timestamp: new Date().toISOString()
    };

    return ApiResponse.success(res, latestVisualMetrics, 'Visual telemetry received');
}));

/**
 * @route GET /api/v1/telemetry/visual
 * @desc Get the latest visual performance data
 */
router.get('/visual', asyncHandler(async (_req: Request, res: Response) => {
    return ApiResponse.success(res, latestVisualMetrics, 'Latest visual telemetry retrieved');
}));

export default router;
