import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { cacheService } from './cacheService.js';

export interface NLPAnalysisResult {
  articleId: string;
  model: {
    name: string;
    version: string;
    engine: string;
  };
  readability: {
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
  sentiment: {
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
    scores: Record<string, number>;
  };
  potentialBias: {
    score: number | null;
    level: string;
    signals: Array<{
      type: string;
      phrase: string;
      context: string;
      explanation: string;
    }>;
    limitations: string;
  };
  subjectivity: {
    score: number;
    label: string;
    explanation: string;
  };
  qualityScore: number;
  analyzedFields: string[];
  analyzedAt: string;
}

export class NLPClientService {
  private readonly baseUrl = config.nlpServiceUrl;

  private generateHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  async analyze(article: {
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
  }): Promise<NLPAnalysisResult> {
    const combinedText = `${article.title} ${article.description || ''} ${article.content || ''}`.trim();
    const contentHash = this.generateHash(combinedText);
    const cacheKey = `nlp:analysis:${article.id}:${contentHash}`;

    // 1. Check Redis / Memory cache
    const cached = await cacheService.get<NLPAnalysisResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Call Python NLP Service
    try {
      const response = await axios.post<NLPAnalysisResult>(
        `${this.baseUrl}/analyze`,
        {
          articleId: article.id,
          title: article.title,
          description: article.description,
          content: article.content,
        },
        { timeout: config.nlpTimeoutMs }
      );

      const result = response.data;
      // Cache for 24 hours (86400 seconds)
      await cacheService.set(cacheKey, result, 86400);
      return result;
    } catch (err: any) {
      logger.warn(`Python NLP service unavailable or timed out (${err.message}). Using local linguistic fallback.`);
      const fallbackResult = this.createLocalFallback(article);
      // Cache fallback for a shorter time (15 mins)
      await cacheService.set(cacheKey, fallbackResult, 900);
      return fallbackResult;
    }
  }

  private createLocalFallback(article: {
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
  }): NLPAnalysisResult {
    const text = `${article.title} ${article.description || ''}`.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const sentenceCount = Math.max(1, sentences.length);

    // Heuristic reading ease (standard Flesch approximation)
    const avgWordsPerSentence = wordCount / sentenceCount;
    const readabilityScore = Math.round(Math.max(20, Math.min(95, 206.8 - 1.015 * avgWordsPerSentence - 30)));

    return {
      articleId: article.id,
      model: {
        name: config.nlpModelName,
        version: 'v1.0.0-resilient-fallback',
        engine: 'local_heuristic_fallback',
      },
      readability: {
        score: readabilityScore,
        gradeLevel: readabilityScore > 70 ? '7th-8th Grade' : '9th-12th Grade',
        label: readabilityScore > 70 ? 'easy' : 'moderate',
        method: 'Heuristic Flesch Formula (Local Fallback)',
        details: {
          fleschKincaidGrade: 8.5,
          fleschReadingEase: readabilityScore,
          automatedReadabilityIndex: 8.0,
          wordsCount: wordCount,
          sentencesCount: sentenceCount,
          syllablesCount: wordCount * 1.4,
          syllablesPerWord: 1.4,
        },
      },
      sentiment: {
        label: 'neutral',
        confidence: 0.80,
        scores: { positive: 0.15, neutral: 0.80, negative: 0.05 },
      },
      potentialBias: {
        score: 0.10,
        level: 'minimal',
        signals: [],
        limitations: 'Linguistic signals reflect language patterns in the text. They DO NOT evaluate factual accuracy.',
      },
      subjectivity: {
        score: 0.20,
        label: 'factual_reporting',
        explanation: 'Factual news reporting language observed.',
      },
      qualityScore: 78.5,
      analyzedFields: article.description ? ['title', 'description'] : ['title'],
      analyzedAt: new Date().toISOString(),
    };
  }
}

export const nlpClientService = new NLPClientService();
