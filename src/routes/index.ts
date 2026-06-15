import { Router } from 'express';
import { aiRouter } from './ai.routes';

const router = Router();

router.use('/ai', aiRouter);

export { router as apiRouter };
