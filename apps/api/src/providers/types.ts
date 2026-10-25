export interface NormalizedArticle {
  providerArticleId?: string;
  title: string;
  description?: string;
  content?: string;
  canonicalUrl: string;
  imageUrl?: string;
  author?: string;
  sourceName: string;
  sourceDomain?: string;
  category: string;
  publishedAt: Date;
  provider: 'rss' | 'newsapi' | 'gnews' | 'mock';
}

export interface NewsProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchArticles(category?: string, query?: string): Promise<NormalizedArticle[]>;
}
