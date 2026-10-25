import { NewsProvider, NormalizedArticle } from './types.js';
import { RssFeedAdapter } from './rssAdapter.js';
import { NewsApiAdapter } from './newsApiAdapter.js';
import { GNewsAdapter } from './gnewsAdapter.js';
import { MockNewsAdapter } from './mockAdapter.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

export function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Lowercase host and protocol
    url.hostname = url.hostname.toLowerCase();
    url.protocol = url.protocol.toLowerCase();

    // Strip tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source', 'platform', 'mc_cid', 'mc_eid'
    ];
    for (const p of trackingParams) {
      url.searchParams.delete(p);
    }

    // Strip trailing slash on pathname and lowercase
    let pathname = url.pathname.toLowerCase();
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    url.pathname = pathname;
    url.hash = ''; // remove anchor

    return url.toString();
  } catch {
    // If not valid URL string, sanitize basic whitespace & trailing slashes
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function computeTitleSimilarity(titleA: string, titleB: string): number {
  const getTokens = (s: string) => {
    return new Set(
      s.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
  };

  const setA = getTokens(titleA);
  const setB = getTokens(titleB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export class ProviderManager {
  private providers: NewsProvider[] = [];

  constructor() {
    // Register adapters
    this.providers.push(new RssFeedAdapter());
    this.providers.push(new NewsApiAdapter());
    this.providers.push(new GNewsAdapter());
    this.providers.push(new MockNewsAdapter());
  }

  getActiveProviders(): NewsProvider[] {
    return this.providers.filter(p => p.isConfigured());
  }

  async fetchAll(category?: string, query?: string): Promise<NormalizedArticle[]> {
    const active = this.getActiveProviders();
    logger.info(`Fetching news from ${active.length} active providers: ${active.map(p => p.name).join(', ')}`);

    const rawArticles: NormalizedArticle[] = [];
    const promises = active.map(async (provider) => {
      try {
        const articles = await provider.fetchArticles(category, query);
        rawArticles.push(...articles);
      } catch (err: any) {
        logger.error(`Error in provider ${provider.name}: ${err.message}`);
      }
    });

    await Promise.allSettled(promises);

    // Deterministic deduplication by canonical URL
    const seenUrls = new Set<string>();
    const deduplicated: NormalizedArticle[] = [];

    for (const item of rawArticles) {
      const normalizedUrl = normalizeCanonicalUrl(item.canonicalUrl);
      item.canonicalUrl = normalizedUrl;

      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        deduplicated.push(item);
      }
    }

    logger.info(`Fetched ${rawArticles.length} raw articles, ${deduplicated.length} unique articles retained after deduplication.`);
    return deduplicated;
  }
}

export const providerManager = new ProviderManager();
