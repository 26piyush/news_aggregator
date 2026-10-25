import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/guest', (req, res, next) => authController.guest(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));

export default router;
