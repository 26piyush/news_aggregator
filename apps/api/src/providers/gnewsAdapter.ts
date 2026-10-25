import axios from 'axios';
import { NewsProvider, NormalizedArticle } from './types.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

export class GNewsAdapter implements NewsProvider {
  readonly name = 'gnews';
  private readonly baseUrl = 'https://gnews.io/api/v4';

  isConfigured(): boolean {
    return Boolean(config.gnewsApiKey && config.gnewsApiKey.trim().length > 0);
  }

  async fetchArticles(categoryFilter?: string, queryFilter?: string): Promise<NormalizedArticle[]> {
    if (!this.isConfigured()) {
      logger.info('GNews is not configured (missing GNEWS_API_KEY). Skipping.');
      return [];
    }

    try {
      const endpoint = queryFilter ? `${this.baseUrl}/search` : `${this.baseUrl}/top-headlines`;
      const params: Record<string, string> = {
        token: config.gnewsApiKey,
        lang: 'en',
        max: '20',
      };

      if (queryFilter) {
        params.q = queryFilter;
      } else {
        params.category = categoryFilter && categoryFilter !== 'all' ? categoryFilter : 'general';
      }

      const response = await axios.get(endpoint, { params, timeout: 6000 });
      if (!Array.isArray(response.data.articles)) {
        return [];
      }

      const results: NormalizedArticle[] = [];
      for (const item of response.data.articles) {
        if (!item.title || !item.url) continue;

        const publishedDate = item.publishedAt ? new Date(item.publishedAt) : new Date();

        results.push({
          providerArticleId: item.url,
          title: item.title.trim(),
          description: item.description?.trim(),
          content: item.content?.trim(),
          canonicalUrl: item.url.trim(),
          imageUrl: item.image || undefined,
          author: item.source?.name || 'GNews Publisher',
          sourceName: item.source?.name || 'GNews Publisher',
          sourceDomain: item.source?.url ? new URL(item.source.url).hostname : undefined,
          category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : 'world',
          publishedAt: isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
          provider: 'gnews',
        });
      }

      return results;
    } catch (err: any) {
      logger.error(`GNews request failed: ${err.response?.data?.errors || err.message}`);
      return [];
    }
  }
}
