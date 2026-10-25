import Parser from 'rss-parser';
import { NewsProvider, NormalizedArticle } from './types.js';
import { logger } from '../config/logger.js';

interface RssFeedSource {
  name: string;
  domain: string;
  category: string;
  url: string;
}

const RSS_FEEDS: RssFeedSource[] = [
  // Technology
  { name: 'TechCrunch', domain: 'techcrunch.com', category: 'technology', url: 'https://techcrunch.com/feed/' },
  { name: 'Wired', domain: 'wired.com', category: 'technology', url: 'https://www.wired.com/feed/rss' },
  // Business
  { name: 'BBC Business', domain: 'bbc.com', category: 'business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { name: 'CNBC', domain: 'cnbc.com', category: 'business', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664' },
  // Science
  { name: 'Phys.org', domain: 'phys.org', category: 'science', url: 'https://phys.org/rss-feed/' },
  { name: 'ScienceDaily', domain: 'sciencedaily.com', category: 'science', url: 'https://www.sciencedaily.com/rss/all.xml' },
  // Health
  { name: 'Medical News Today', domain: 'medicalnewstoday.com', category: 'health', url: 'https://www.medicalnewstoday.com/feed' },
  { name: 'NPR Health', domain: 'npr.org', category: 'health', url: 'https://feeds.npr.org/1128/rss.xml' },
  // World
  { name: 'BBC World News', domain: 'bbc.com', category: 'world', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'NPR World', domain: 'npr.org', category: 'world', url: 'https://feeds.npr.org/1004/rss.xml' },
  // Politics
  { name: 'NPR Politics', domain: 'npr.org', category: 'politics', url: 'https://feeds.npr.org/1014/rss.xml' },
  // Sports
  { name: 'BBC Sport', domain: 'bbc.co.uk', category: 'sports', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
  { name: 'ESPN', domain: 'espn.com', category: 'sports', url: 'https://www.espn.com/espn/rss/news' }
];

export class RssFeedAdapter implements NewsProvider {
  readonly name = 'rss';
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-NewsAggregator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8'
      },
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: false }],
          ['enclosure', 'enclosure'],
          ['content:encoded', 'contentEncoded']
        ]
      }
    });
  }

  isConfigured(): boolean {
    return true; // RSS requires no API keys
  }

  async fetchArticles(categoryFilter?: string, queryFilter?: string): Promise<NormalizedArticle[]> {
    const feedsToFetch = categoryFilter && categoryFilter !== 'all'
      ? RSS_FEEDS.filter(f => f.category === categoryFilter.toLowerCase())
      : RSS_FEEDS;

    const results: NormalizedArticle[] = [];

    // Parallel fetch with promise settling so one slow feed never blocks the others
    const promises = feedsToFetch.map(async (feed) => {
      try {
        const parsed = await this.parser.parseURL(feed.url);
        if (!parsed.items || !Array.isArray(parsed.items)) return;

        for (const item of parsed.items.slice(0, 10)) {
          if (!item.title || !item.link) continue;

          // Optional search query filter
          if (queryFilter) {
            const matchTitle = item.title.toLowerCase().includes(queryFilter.toLowerCase());
            const matchDesc = (item.contentSnippet || item.content || '').toLowerCase().includes(queryFilter.toLowerCase());
            if (!matchTitle && !matchDesc) continue;
          }

          // Extract image if available
          let imageUrl: string | undefined = undefined;
          if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
            imageUrl = item.enclosure.url;
          } else if ((item as any).mediaContent && (item as any).mediaContent.$ && (item as any).mediaContent.$.url) {
            imageUrl = (item as any).mediaContent.$.url;
          }

          // Clean description of HTML
          const rawDesc = item.contentSnippet || item.content || item.summary || '';
          const cleanDesc = rawDesc.replace(/<[^>]+>/g, '').trim();

          const publishedDate = item.pubDate ? new Date(item.pubDate) : new Date();

          results.push({
            providerArticleId: item.guid || item.link,
            title: item.title.trim(),
            description: cleanDesc ? cleanDesc.slice(0, 500) : undefined,
            content: (item as any).contentEncoded ? (item as any).contentEncoded.replace(/<[^>]+>/g, '').slice(0, 2000) : cleanDesc,
            canonicalUrl: item.link.trim(),
            imageUrl,
            author: item.creator || item.author || feed.name,
            sourceName: feed.name,
            sourceDomain: feed.domain,
            category: feed.category,
            publishedAt: isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
            provider: 'rss',
          });
        }
      } catch (err: any) {
        logger.warn(`RSS Feed fetch warning for ${feed.name} (${feed.url}): ${err.message}`);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}
