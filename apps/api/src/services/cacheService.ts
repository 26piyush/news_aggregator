import Redis from 'ioredis';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, MemoryCacheEntry>();
  private isRedisConnected = false;

  constructor() {
    if (config.enableRedis) {
      try {
        this.redis = new Redis(config.redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy: (times) => {
            if (times > 3) {
              logger.warn('Redis reconnection limit reached. Falling back to in-memory caching.');
              return null; // stop retrying
            }
            return Math.min(times * 200, 1000);
          },
          lazyConnect: true,
        });

        this.redis.on('connect', () => {
          this.isRedisConnected = true;
          logger.info('Connected to Redis server.');
        });

        this.redis.on('error', (err) => {
          this.isRedisConnected = false;
          logger.warn(`Redis connection error (${err.message}). Using memory cache fallback.`);
        });

        // Trigger connection asynchronously
        this.redis.connect().catch((err) => {
          this.isRedisConnected = false;
          logger.info(`Redis not available (${err.message}). Defaulting to memory cache fallback.`);
        });
      } catch (err: any) {
        this.isRedisConnected = false;
        logger.warn(`Failed to initialize Redis client: ${err.message}. Using memory cache.`);
      }
    } else {
      logger.info('Redis caching is disabled in configuration (ENABLE_REDIS=false). Using in-memory cache.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw !== null) {
          logger.debug(`[Cache Hit] Redis key: ${key}`);
          return JSON.parse(raw) as T;
        }
        logger.debug(`[Cache Miss] Redis key: ${key}`);
      } catch (err: any) {
        logger.warn(`Redis GET failed for ${key}: ${err.message}`);
      }
    }

    // Memory cache fallback
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        logger.debug(`[Cache Hit] Memory key: ${key}`);
        return entry.value as T;
      }
      this.memoryCache.delete(key);
    }
    logger.debug(`[Cache Miss] Memory key: ${key}`);
    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = config.redisTtlSeconds): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, serialized, 'EX', ttlSeconds);
        logger.debug(`[Cache Set] Redis key: ${key} (TTL: ${ttlSeconds}s)`);
      } catch (err: any) {
        logger.warn(`Redis SET failed for ${key}: ${err.message}`);
      }
    }

    // Always keep memory cache synced for instant fallback
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
      } catch (err: any) {
        logger.warn(`Redis DEL failed for ${key}: ${err.message}`);
      }
    }
    this.memoryCache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    logger.info(`Invalidating cache pattern: ${pattern}`);
    if (this.isRedisConnected && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (err: any) {
        logger.warn(`Redis pattern invalidation failed: ${err.message}`);
      }
    }

    // Memory cache prefix matching
    const prefix = pattern.replace('*', '');
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    if (this.isRedisConnected && this.redis) {
      try {
        const ping = await this.redis.ping();
        return ping === 'PONG';
      } catch {
        return false;
      }
    }
    return true; // Memory cache is always healthy
  }

  getMode(): 'redis' | 'memory' {
    return this.isRedisConnected ? 'redis' : 'memory';
  }
}

export const cacheService = new CacheService();
