import { Router } from 'express';
import voiceRouter from './voice';
import healthRouter from './health';

const router = Router();

// Mount route modules
router.use('/', voiceRouter);
router.use('/', healthRouter);

export default router;
