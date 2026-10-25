export interface NewsSource {
  id: string;
  name: string;
  domain?: string | null;
  provider: string;
  homepageUrl?: string | null;
}

export interface BiasSignal {
  type: string;
  phrase: string;
  context: string;
  explanation: string;
}

export interface ArticleAnalysis {
  id?: string;
  articleId?: string;
  modelName?: string;
  modelVersion?: string;
  model?: {
    name: string;
    version: string;
    engine: string;
  };
  readabilityScore: number;
  readabilityLabel?: string | null;
  readability?: {
    score: number;
    gradeLevel: string;
    label: string;
    method: string;
    details: {
      fleschKincaidGrade: number;
      fleschReadingEase: number;
      automatedReadabilityIndex: number;
      wordsCount: number;
      sentencesCount: number;
      syllablesCount: number;
      syllablesPerWord: number;
    };
  };
  linguisticSignals?: BiasSignal[] | any;
  sentimentLabel?: 'positive' | 'neutral' | 'negative' | string | null;
  sentimentConfidence?: number | null;
  sentiment?: {
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
    scores?: Record<string, number>;
  };
  subjectivityScore?: number | null;
  subjectivity?: {
    score: number;
    label: string;
    explanation: string;
  };
  potentialBiasScore?: number | null;
  potentialBiasLevel?: 'minimal' | 'low' | 'moderate' | 'elevated' | 'not_assessed' | string | null;
  potentialBias?: {
    score: number | null;
    level: string;
    signals: BiasSignal[];
    limitations: string;
  };
  qualityScore?: number | null;
  explanation?: string | null;
  analyzedAt?: string | Date;
}

export interface Article {
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
  publishedAt: string;
  fetchedAt: string;
  source: NewsSource;
  analysis?: ArticleAnalysis | null;
}

export interface NewsFeedResponse {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
  source?: 'origin' | 'cache';
}

export interface NewsFilterState {
  category: string;
  search: string;
  sourceId: string;
  sortBy: 'publishedAt' | 'readability' | 'quality' | 'title';
  order: 'asc' | 'desc';
  minReadability?: number;
  sentiment?: string;
  biasLevel?: string;
  page: number;
  limit: number;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'user' | 'guest';
}

export interface AuthResponse {
  message: string;
  user: User;
  token?: string;
  guestId?: string;
}
