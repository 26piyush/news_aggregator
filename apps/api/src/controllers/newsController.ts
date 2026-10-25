import { Request, Response, NextFunction } from 'express';
import { NewsQuerySchema } from '../schemas/index.js';
import { articleRepository } from '../repositories/articleRepository.js';
import { nlpClientService } from '../services/nlpClientService.js';
import { cacheService } from '../services/cacheService.js';
import { ingestionService } from '../services/ingestionService.js';
import { logger } from '../config/logger.js';

export class NewsController {
  async getNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = NewsQuerySchema.parse(req.query);
      const cacheKey = `news:feed:${JSON.stringify(query)}`;

      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.json({ ...cached, source: 'cache' });
        return;
      }

      const result = await articleRepository.findArticles(query);
      // Cache news feed for 5 minutes (300 seconds)
      await cacheService.set(cacheKey, result, 300);

      res.json({ ...result, source: 'origin' });
    } catch (err) {
      next(err);
    }
  }

  async getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
      const cacheKey = `news:latest:${limit}`;

      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.json({ ...cached, source: 'cache' });
        return;
      }

      const result = await articleRepository.findArticles({
        page: 1,
        limit,
        category: 'all',
        sortBy: 'publishedAt',
        order: 'desc',
      });

      await cacheService.set(cacheKey, result, 180);
      res.json({ ...result, source: 'origin' });
    } catch (err) {
      next(err);
    }
  }

  async getArticleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const article = await articleRepository.findArticleById(id);

      if (!article) {
        res.status(404).json({ error: 'Article not found', statusCode: 404 });
        return;
      }

      res.json({ article });
    } catch (err) {
      next(err);
    }
  }

  async searchNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = (req.query.q as string) || '';
      const category = (req.query.category as string) || 'all';
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const cacheKey = `news:search:${q}:${category}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.json({ ...cached, source: 'cache' });
        return;
      }

      const result = await articleRepository.findArticles({
        page,
        limit,
        search: q,
        category: category as any,
        sortBy: 'publishedAt',
        order: 'desc',
      });

      await cacheService.set(cacheKey, result, 300);
      res.json({ ...result, source: 'origin' });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = articleRepository.getCategories();
      res.json({ categories });
    } catch (err) {
      next(err);
    }
  }

  async getSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sources = await articleRepository.getSources();
      res.json({ sources });
    } catch (err) {
      next(err);
    }
  }

  async getArticleAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const article = await articleRepository.findArticleById(id);

      if (!article) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }

      if (article.analysis) {
        res.json({ analysis: article.analysis, source: 'persisted' });
        return;
      }

      // Generate analysis on demand
      const analysis = await nlpClientService.analyze({
        id: article.id,
        title: article.title,
        description: article.description,
        content: article.content,
      });

      await articleRepository.saveAnalysis(analysis);
      const updated = await articleRepository.findArticleById(id);
      res.json({ analysis: updated?.analysis || analysis, source: 'generated' });
    } catch (err) {
      next(err);
    }
  }

  async analyzeArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const article = await articleRepository.findArticleById(id);

      if (!article) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }

      const analysis = await nlpClientService.analyze({
        id: article.id,
        title: article.title,
        description: article.description,
        content: article.content,
      });

      await articleRepository.saveAnalysis(analysis);
      const updated = await articleRepository.findArticleById(id);
      res.json({ analysis: updated?.analysis || analysis, message: 'Analysis updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async triggerIngestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      // Invalidate feed cache immediately so fresh database records appear
      await cacheService.invalidatePattern('news:*');

      if (ingestionService.isRunning()) {
        res.json({
          message: 'News ingestion is already running in background.',
          status: 'in_progress',
        });
        return;
      }

      // Execute ingestion asynchronously in background to prevent HTTP timeouts
      ingestionService.ingestNews(category).catch((err: any) => {
        logger.error(`Manual ingestion error: ${err.message}`);
      });

      res.json({
        message: 'News ingestion initiated successfully.',
        status: 'started',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const newsController = new NewsController();
