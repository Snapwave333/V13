import { Router } from 'express';
import authRoutes from './auth.routes';
import vibeRoutes from './vibe.routes';
import metricsRoutes from './metrics.routes';
import telemetryRoutes from './telemetry.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vibe', vibeRoutes);
router.use('/metrics', metricsRoutes);
router.use('/telemetry', telemetryRoutes);

export default router;
