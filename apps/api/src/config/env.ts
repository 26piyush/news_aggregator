import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/news_aggregator?schema=public',
  
  // Redis Caching
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  enableRedis: process.env.ENABLE_REDIS === 'true',
  redisTtlSeconds: parseInt(process.env.REDIS_CACHE_TTL_SECONDS || '900', 10),

  // External APIs
  newsApiKey: process.env.NEWS_API_KEY || '',
  gnewsApiKey: process.env.GNEWS_API_KEY || '',
  enableMockFallback: process.env.ENABLE_MOCK_FALLBACK !== 'false',

  // Python NLP Service
  nlpServiceUrl: process.env.NLP_SERVICE_URL || 'http://localhost:8000',
  nlpModelName: process.env.NLP_MODEL_NAME || 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
  nlpTimeoutMs: parseInt(process.env.NLP_TIMEOUT_MS || '8000', 10),

  // Supabase Auth
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Ingestion Scheduling
  ingestionIntervalMinutes: parseInt(process.env.INGESTION_INTERVAL_MINUTES || '30', 10),
};
