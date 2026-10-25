import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

router.get('/health', (req, res) => healthController.health(req, res));
router.get('/ready', (req, res) => healthController.ready(req, res));

export default router;
