import axios from 'axios';
import { NewsProvider, NormalizedArticle } from './types.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

export class NewsApiAdapter implements NewsProvider {
  readonly name = 'newsapi';
  private readonly baseUrl = 'https://newsapi.org/v2';

  isConfigured(): boolean {
    return Boolean(config.newsApiKey && config.newsApiKey.trim().length > 0);
  }

  async fetchArticles(categoryFilter?: string, queryFilter?: string): Promise<NormalizedArticle[]> {
    if (!this.isConfigured()) {
      logger.info('NewsAPI is not configured (missing NEWS_API_KEY). Skipping.');
      return [];
    }

    try {
      const endpoint = queryFilter ? `${this.baseUrl}/everything` : `${this.baseUrl}/top-headlines`;
      const params: Record<string, string> = {
        apiKey: config.newsApiKey,
        pageSize: '25',
        language: 'en',
      };

      if (queryFilter) {
        params.q = queryFilter;
        params.sortBy = 'publishedAt';
      } else {
        params.country = 'us';
        if (categoryFilter && categoryFilter !== 'all') {
          // NewsAPI supports: business, entertainment, general, health, science, sports, technology
          params.category = categoryFilter === 'world' ? 'general' : categoryFilter;
        }
      }

      const response = await axios.get(endpoint, { params, timeout: 6000 });
      if (response.data.status !== 'ok' || !Array.isArray(response.data.articles)) {
        logger.warn(`NewsAPI returned non-ok status: ${response.data.status}`);
        return [];
      }

      const results: NormalizedArticle[] = [];
      for (const item of response.data.articles) {
        if (!item.title || !item.url || item.title === '[Removed]') continue;

        const publishedDate = item.publishedAt ? new Date(item.publishedAt) : new Date();

        results.push({
          providerArticleId: item.url,
          title: item.title.trim(),
          description: item.description?.trim(),
          content: item.content?.trim(),
          canonicalUrl: item.url.trim(),
          imageUrl: item.urlToImage || undefined,
          author: item.author || item.source?.name || 'Staff Reporter',
          sourceName: item.source?.name || 'NewsAPI Source',
          sourceDomain: item.source?.id || undefined,
          category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : 'technology',
          publishedAt: isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
          provider: 'newsapi',
        });
      }

      return results;
    } catch (err: any) {
      logger.error(`NewsAPI request failed: ${err.response?.data?.message || err.message}`);
      return [];
    }
  }
}
