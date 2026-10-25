import { prisma, isDatabaseConnected } from './prisma.js';
import { NormalizedArticle } from '../providers/types.js';
import { NLPAnalysisResult } from '../services/nlpClientService.js';
import { NewsQuery } from '../schemas/index.js';
import { logger } from '../config/logger.js';
import { MOCK_ARTICLES } from '../providers/mockAdapter.js';

export interface StoredArticle {
  id: string;
  providerArticleId?: string | null;
  title: string;
  description?: string | null;
  content?: string | null;
  canonicalUrl: string;
  imageUrl?: string | null;
  author?: string | null;
  sourceId: string;
  category: string;
  publishedAt: Date;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  source: {
    id: string;
    name: string;
    domain?: string | null;
    provider: string;
    homepageUrl?: string | null;
  };
  analysis?: {
    id: string;
    modelName: string;
    modelVersion: string;
    readabilityScore: number;
    readabilityLabel?: string | null;
    linguisticSignals: any;
    sentimentLabel?: string | null;
    sentimentConfidence?: number | null;
    subjectivityScore?: number | null;
    potentialBiasScore?: number | null;
    potentialBiasLevel?: string | null;
    qualityScore?: number | null;
    explanation?: string | null;
    analyzedAt: Date;
  } | null;
}

// In-memory fallback store for offline development and testing
class MemoryArticleStore {
  private articles = new Map<string, StoredArticle>();
  private sources = new Map<string, { id: string; name: string; domain?: string; provider: string }>();

  constructor() {
    this.seedMockData();
  }

  seedMockData() {
    for (const art of MOCK_ARTICLES) {
      let sourceId = 'src-' + art.sourceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      if (!this.sources.has(sourceId)) {
        this.sources.set(sourceId, {
          id: sourceId,
          name: art.sourceName,
          domain: art.sourceDomain,
          provider: art.provider,
        });
      }

      const id = 'art-' + (art.providerArticleId || Math.random().toString(36).slice(2, 9));
      this.articles.set(id, {
        id,
        providerArticleId: art.providerArticleId,
        title: art.title,
        description: art.description,
        content: art.content,
        canonicalUrl: art.canonicalUrl,
        imageUrl: art.imageUrl,
        author: art.author,
        sourceId,
        category: art.category,
        publishedAt: art.publishedAt,
        fetchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        source: this.sources.get(sourceId)!,
        analysis: null,
      });
    }
  }

  upsertArticle(item: NormalizedArticle): StoredArticle {
    // Check if canonicalUrl already exists
    for (const existing of this.articles.values()) {
      if (existing.canonicalUrl === item.canonicalUrl) {
        return existing;
      }
    }

    const sourceId = 'src-' + item.sourceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (!this.sources.has(sourceId)) {
      this.sources.set(sourceId, {
        id: sourceId,
        name: item.sourceName,
        domain: item.sourceDomain,
        provider: item.provider,
      });
    }

    const id = 'art-' + (item.providerArticleId || Math.random().toString(36).slice(2, 9));
    const article: StoredArticle = {
      id,
      providerArticleId: item.providerArticleId,
      title: item.title,
      description: item.description,
      content: item.content,
      canonicalUrl: item.canonicalUrl,
      imageUrl: item.imageUrl,
      author: item.author,
      sourceId,
      category: item.category,
      publishedAt: item.publishedAt,
      fetchedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      source: this.sources.get(sourceId)!,
      analysis: null,
    };
    this.articles.set(id, article);
    return article;
  }

  saveAnalysis(analysis: NLPAnalysisResult) {
    const article = this.articles.get(analysis.articleId);
    if (article) {
      article.analysis = {
        id: 'ana-' + Math.random().toString(36).slice(2, 9),
        modelName: analysis.model.name,
        modelVersion: analysis.model.version,
        readabilityScore: analysis.readability.score,
        readabilityLabel: analysis.readability.label,
        linguisticSignals: analysis.potentialBias.signals,
        sentimentLabel: analysis.sentiment.label,
        sentimentConfidence: analysis.sentiment.confidence,
        subjectivityScore: analysis.subjectivity.score,
        potentialBiasScore: analysis.potentialBias.score,
        potentialBiasLevel: analysis.potentialBias.level,
        qualityScore: analysis.qualityScore,
        explanation: analysis.potentialBias.limitations,
        analyzedAt: new Date(analysis.analyzedAt),
      };
    }
  }

  getArticles(query: NewsQuery): { articles: StoredArticle[]; total: number; page: number; totalPages: number } {
    let list = Array.from(this.articles.values());

    // Category filter
    if (query.category && query.category !== 'all') {
      list = list.filter(a => a.category.toLowerCase() === query.category!.toLowerCase());
    }

    // Source filter
    if (query.sourceId) {
      list = list.filter(a => a.sourceId === query.sourceId || a.source.name.toLowerCase().includes(query.sourceId!.toLowerCase()));
    }

    // Search query
    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.author && a.author.toLowerCase().includes(q))
      );
    }

    // Min Readability
    if (query.minReadability !== undefined) {
      list = list.filter(a => a.analysis ? a.analysis.readabilityScore >= query.minReadability! : true);
    }

    // Sentiment
    if (query.sentiment) {
      list = list.filter(a => a.analysis ? a.analysis.sentimentLabel === query.sentiment : true);
    }

    // Bias Level
    if (query.biasLevel) {
      list = list.filter(a => a.analysis ? a.analysis.potentialBiasLevel === query.biasLevel : true);
    }

    // Sorting
    list.sort((a, b) => {
      if (query.sortBy === 'readability') {
        const scoreA = a.analysis?.readabilityScore ?? 50;
        const scoreB = b.analysis?.readabilityScore ?? 50;
        return query.order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      if (query.sortBy === 'quality') {
        const scoreA = a.analysis?.qualityScore ?? 50;
        const scoreB = b.analysis?.qualityScore ?? 50;
        return query.order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      if (query.sortBy === 'title') {
        return query.order === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      // Default: publishedAt
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      return query.order === 'asc' ? timeA - timeB : timeB - timeA;
    });

    const total = list.length;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      articles: paginated,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  getArticleById(id: string): StoredArticle | null {
    return this.articles.get(id) || null;
  }

  getSources() {
    return Array.from(this.sources.values());
  }
}

export const memoryStore = new MemoryArticleStore();

export class ArticleRepository {
  private sourceIdCache = new Map<string, string>();

  async upsertArticleWithSource(item: NormalizedArticle): Promise<StoredArticle> {
    if (!isDatabaseConnected()) {
      return memoryStore.upsertArticle(item);
    }

    try {
      // 1. Ensure NewsSource exists in PostgreSQL (cached to avoid redundant queries)
      let sourceId = this.sourceIdCache.get(item.sourceName);
      if (!sourceId) {
        const source = await prisma.newsSource.upsert({
          where: { name: item.sourceName },
          update: {
            domain: item.sourceDomain,
            provider: item.provider,
          },
          create: {
            name: item.sourceName,
            domain: item.sourceDomain,
            provider: item.provider,
          },
        });
        sourceId = source.id;
        this.sourceIdCache.set(item.sourceName, sourceId);
      }

      // 2. Upsert Article by canonicalUrl
      const article = await prisma.article.upsert({
        where: { canonicalUrl: item.canonicalUrl },
        update: {
          title: item.title,
          description: item.description,
          content: item.content,
          imageUrl: item.imageUrl,
          author: item.author,
          category: item.category,
          publishedAt: item.publishedAt,
        },
        create: {
          providerArticleId: item.providerArticleId,
          title: item.title,
          description: item.description,
          content: item.content,
          canonicalUrl: item.canonicalUrl,
          imageUrl: item.imageUrl,
          author: item.author,
          sourceId: sourceId,
          category: item.category,
          publishedAt: item.publishedAt,
        },
        include: {
          source: true,
          analysis: true,
        },
      });

      return article as StoredArticle;
    } catch (err: any) {
      logger.warn(`Prisma upsert failed: ${err.message}. Using memory fallback.`);
      return memoryStore.upsertArticle(item);
    }
  }

  async findArticles(query: NewsQuery): Promise<{ articles: StoredArticle[]; total: number; page: number; totalPages: number }> {
    if (!isDatabaseConnected()) {
      return memoryStore.getArticles(query);
    }

    try {
      const where: any = {};

      if (query.category && query.category !== 'all') {
        where.category = query.category;
      }

      if (query.sourceId) {
        where.sourceId = query.sourceId;
      }

      if (query.search && query.search.trim()) {
        const q = query.search.trim();
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (query.minReadability !== undefined) {
        where.analysis = {
          readabilityScore: { gte: query.minReadability },
        };
      }

      if (query.sentiment) {
        where.analysis = {
          ...(where.analysis || {}),
          sentimentLabel: query.sentiment,
        };
      }

      const orderBy: any = {};
      if (query.sortBy === 'readability') {
        orderBy.analysis = { readabilityScore: query.order };
      } else if (query.sortBy === 'quality') {
        orderBy.analysis = { qualityScore: query.order };
      } else if (query.sortBy === 'title') {
        orderBy.title = query.order;
      } else {
        orderBy.publishedAt = query.order;
      }

      const total = await prisma.article.count({ where });
      const page = query.page || 1;
      const limit = query.limit || 20;

      const articles = await prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          source: true,
          analysis: true,
        },
      });

      return {
        articles: articles as StoredArticle[],
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (err: any) {
      logger.warn(`Prisma findArticles error: ${err.message}. Falling back to memory store.`);
      return memoryStore.getArticles(query);
    }
  }

  async findArticleById(id: string): Promise<StoredArticle | null> {
    if (!isDatabaseConnected()) {
      return memoryStore.getArticleById(id);
    }

    try {
      const article = await prisma.article.findUnique({
        where: { id },
        include: {
          source: true,
          analysis: true,
        },
      });
      return (article as StoredArticle) || memoryStore.getArticleById(id);
    } catch {
      return memoryStore.getArticleById(id);
    }
  }

  async saveAnalysis(analysis: NLPAnalysisResult): Promise<void> {
    memoryStore.saveAnalysis(analysis);

    if (isDatabaseConnected()) {
      try {
        await prisma.articleAnalysis.upsert({
          where: { articleId: analysis.articleId },
          update: {
            modelName: analysis.model.name,
            modelVersion: analysis.model.version,
            readabilityScore: analysis.readability.score,
            readabilityLabel: analysis.readability.label,
            linguisticSignals: analysis.potentialBias.signals as any,
            sentimentLabel: analysis.sentiment.label,
            sentimentConfidence: analysis.sentiment.confidence,
            subjectivityScore: analysis.subjectivity.score,
            potentialBiasScore: analysis.potentialBias.score,
            potentialBiasLevel: analysis.potentialBias.level,
            qualityScore: analysis.qualityScore,
            explanation: analysis.potentialBias.limitations,
            analyzedAt: new Date(analysis.analyzedAt),
          },
          create: {
            articleId: analysis.articleId,
            modelName: analysis.model.name,
            modelVersion: analysis.model.version,
            readabilityScore: analysis.readability.score,
            readabilityLabel: analysis.readability.label,
            linguisticSignals: analysis.potentialBias.signals as any,
            sentimentLabel: analysis.sentiment.label,
            sentimentConfidence: analysis.sentiment.confidence,
            subjectivityScore: analysis.subjectivity.score,
            potentialBiasScore: analysis.potentialBias.score,
            potentialBiasLevel: analysis.potentialBias.level,
            qualityScore: analysis.qualityScore,
            explanation: analysis.potentialBias.limitations,
            analyzedAt: new Date(analysis.analyzedAt),
          },
        });
      } catch (err: any) {
        logger.warn(`Prisma saveAnalysis failed: ${err.message}`);
      }
    }
  }

  async getSources() {
    if (!isDatabaseConnected()) {
      return memoryStore.getSources();
    }
    try {
      return await prisma.newsSource.findMany({ orderBy: { name: 'asc' } });
    } catch {
      return memoryStore.getSources();
    }
  }

  getCategories(): string[] {
    return [
      'all',
      'technology',
      'business',
      'science',
      'health',
      'politics',
      'sports',
      'world',
    ];
  }
}

export const articleRepository = new ArticleRepository();
