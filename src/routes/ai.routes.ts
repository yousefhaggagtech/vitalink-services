// src/routes/ai.routes.ts

import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate, requireCoach } from '../middleware/auth.middleware';
import { aiRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.use(authenticate);        
router.use(requireCoach);        
router.use(aiRateLimiter);

router.get('/:beltId/latest', aiController.getLatest);
router.get('/:beltId/timeline', aiController.getTimeline);
router.get('/:beltId/health', aiController.getHealth);

export { router as aiRouter };
