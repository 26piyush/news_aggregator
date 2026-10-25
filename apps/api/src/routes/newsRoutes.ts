import { Router } from 'express';
import { newsController } from '../controllers/newsController.js';

const router = Router();

// Feed and Search
router.get('/', (req, res, next) => newsController.getNews(req, res, next));
router.get('/latest', (req, res, next) => newsController.getLatest(req, res, next));
router.get('/search', (req, res, next) => newsController.searchNews(req, res, next));

// Metadata
router.get('/categories', (req, res, next) => newsController.getCategories(req, res, next));
router.get('/sources', (req, res, next) => newsController.getSources(req, res, next));

// Individual article and on-demand analysis
router.get('/:id', (req, res, next) => newsController.getArticleById(req, res, next));
router.get('/:id/analysis', (req, res, next) => newsController.getArticleAnalysis(req, res, next));
router.post('/:id/analyze', (req, res, next) => newsController.analyzeArticle(req, res, next));

// Ingestion trigger
router.post('/ingest', (req, res, next) => newsController.triggerIngestion(req, res, next));

export default router;
