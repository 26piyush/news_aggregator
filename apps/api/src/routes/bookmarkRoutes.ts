import { Router } from 'express';
import { bookmarkController } from '../controllers/bookmarkController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Apply auth middleware to all bookmark routes
router.use(authMiddleware);

router.get('/', (req, res, next) => bookmarkController.getBookmarks(req, res, next));
router.post('/', (req, res, next) => bookmarkController.addBookmark(req, res, next));
router.delete('/:id', (req, res, next) => bookmarkController.removeBookmark(req, res, next));

export default router;
