import { providerManager } from '../providers/providerManager.js';
import { articleRepository, StoredArticle } from '../repositories/articleRepository.js';
import { nlpClientService } from './nlpClientService.js';
import { cacheService } from './cacheService.js';
import { logger } from '../config/logger.js';

export class IngestionService {
  private isIngesting = false;

  isRunning(): boolean {
    return this.isIngesting;
  }

  async ingestNews(category?: string, query?: string): Promise<{ fetched: number; saved: number; analyzed: number }> {
    if (this.isIngesting) {
      logger.info('News ingestion already in progress. Skipping concurrent run.');
      return { fetched: 0, saved: 0, analyzed: 0 };
    }

    this.isIngesting = true;
    try {
      logger.info(`Starting news ingestion (category: ${category || 'all'}, query: ${query || 'none'})...`);
      const articles = await providerManager.fetchAll(category, query);

      let savedCount = 0;
      let analyzedCount = 0;

      // Process articles in concurrent batches of 5 for high performance
      const BATCH_SIZE = 5;
      for (let i = 0; i < articles.length; i += BATCH_SIZE) {
        const batch = articles.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item) => {
            try {
              const stored = await articleRepository.upsertArticleWithSource(item);
              savedCount++;

              // Trigger NLP Analysis if not already analyzed
              if (!stored.analysis) {
                try {
                  const analysis = await nlpClientService.analyze({
                    id: stored.id,
                    title: stored.title,
                    description: stored.description,
                    content: stored.content,
                  });
                  await articleRepository.saveAnalysis(analysis);
                  analyzedCount++;
                } catch (nlpErr: any) {
                  logger.warn(`NLP analysis error for article ${stored.id}: ${nlpErr.message}`);
                }
              }
            } catch (itemErr: any) {
              logger.warn(`Failed to process article ${item.canonicalUrl}: ${itemErr.message}`);
            }
          })
        );
      }

      // Invalidate cached feeds so fresh stories show up immediately
      await cacheService.invalidatePattern('news:*');
      logger.info(`Ingestion complete! Fetched: ${articles.length}, Saved: ${savedCount}, Analyzed: ${analyzedCount}`);

      return {
        fetched: articles.length,
        saved: savedCount,
        analyzed: analyzedCount,
      };
    } finally {
      this.isIngesting = false;
    }
  }
}

export const ingestionService = new IngestionService();
