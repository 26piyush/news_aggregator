import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { normalizeCanonicalUrl, computeTitleSimilarity } from '../providers/providerManager.js';
import { cacheService } from '../services/cacheService.js';
import { nlpClientService } from '../services/nlpClientService.js';

describe('News Provider Normalization and Deduplication', () => {
  it('normalizes canonical URLs by lowercasing host and removing tracking params', () => {
    const rawUrl = 'https://Example.COM/news/Article-1/?utm_source=twitter&utm_medium=social&ref=homepage#comments';
    const normalized = normalizeCanonicalUrl(rawUrl);
    expect(normalized).toBe('https://example.com/news/article-1');
  });

  it('computes title similarity correctly', () => {
    const titleA = 'Federal Reserve Holds Benchmark Interest Rates Steady';
    const titleB = 'Fed Holds Benchmark Rates Steady as Inflation Moderates';
    const titleC = 'James Webb Telescope Discovers Water Vapor on Exoplanet';

    const simAB = computeTitleSimilarity(titleA, titleB);
    const simAC = computeTitleSimilarity(titleA, titleC);

    expect(simAB).toBeGreaterThanOrEqual(0.4);
    expect(simAC).toBeLessThan(0.1);
  });
});

describe('Cache Service Resilience', () => {
  it('handles set, get, and del with in-memory or redis fallback', async () => {
    const testKey = 'test:cache:key-1';
    const data = { message: 'hello-cache', value: 42 };

    await cacheService.set(testKey, data, 10);
    const retrieved = await cacheService.get<typeof data>(testKey);
    expect(retrieved).toEqual(data);

    await cacheService.del(testKey);
    const afterDelete = await cacheService.get(testKey);
    expect(afterDelete).toBeNull();
  });
});

describe('NLP Client Service and Fallback', () => {
  it('produces valid analysis schema with readability, sentiment, and quality score', async () => {
    const article = {
      id: 'test-article-nlp',
      title: 'Global Renewable Energy Reaches Historic Production Peak',
      description: 'Wind and solar capacity additions exceeded expectations across continental power grids.',
      content: 'Grid operators reported record stability and reduced wholesale electricity costs.',
    };

    const analysis = await nlpClientService.analyze(article);
    expect(analysis.articleId).toBe('test-article-nlp');
    expect(analysis.readability.score).toBeGreaterThanOrEqual(0);
    expect(analysis.sentiment.label).toBeDefined();
    expect(analysis.potentialBias.level).toBeDefined();
    expect(analysis.potentialBias.limitations).toContain('DO NOT evaluate factual accuracy');
    expect(analysis.qualityScore).toBeGreaterThan(0);
  });
});

describe('REST API Endpoints', () => {
  let sampleArticleId = '';

  it('GET /health returns healthy status and service telemetry', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services).toBeDefined();
  }, 15000);

  it('GET /ready returns ready status', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('GET /api/news returns paginated news articles', async () => {
    const res = await request(app).get('/api/news?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articles.length).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);

    sampleArticleId = res.body.articles[0].id;
  });

  it('GET /api/news filters by category', async () => {
    const res = await request(app).get('/api/news?category=technology');
    expect(res.status).toBe(200);
    for (const art of res.body.articles) {
      expect(art.category.toLowerCase()).toBe('technology');
    }
  });

  it('GET /api/news filters by search keyword', async () => {
    const res = await request(app).get('/api/news?search=Consortium');
    expect(res.status).toBe(200);
    expect(res.body.articles.length).toBeGreaterThan(0);
    expect(res.body.articles[0].title).toContain('Consortium');
  });

  it('GET /api/news validates query parameters (rejects limit > 100)', async () => {
    const res = await request(app).get('/api/news?limit=999');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('GET /api/categories returns standard news categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.categories).toContain('technology');
    expect(res.body.categories).toContain('business');
  });

  it('GET /api/sources returns list of news sources', async () => {
    const res = await request(app).get('/api/sources');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sources)).toBe(true);
  });

  it('GET /api/news/:id returns single article or 404 for unknown ID', async () => {
    const res = await request(app).get(`/api/news/${sampleArticleId}`);
    expect(res.status).toBe(200);
    expect(res.body.article.id).toBe(sampleArticleId);

    const notFound = await request(app).get('/api/news/non-existent-id-12345');
    expect(notFound.status).toBe(404);
  });

  it('GET /api/news/:id/analysis returns or generates analysis', async () => {
    const res = await request(app).get(`/api/news/${sampleArticleId}/analysis`);
    expect(res.status).toBe(200);
    expect(res.body.analysis).toBeDefined();
    expect(res.body.analysis.readabilityScore).toBeDefined();
  });
});

describe('Bookmarks API', () => {
  let bookmarkedId = '';

  beforeAll(async () => {
    const newsRes = await request(app).get('/api/news?limit=1');
    bookmarkedId = newsRes.body.articles[0].id;
  });

  it('manages bookmarks with validation and guest user scoping', async () => {
    // Add bookmark
    const addRes = await request(app)
      .post('/api/bookmarks')
      .send({ articleId: bookmarkedId });
    expect(addRes.status).toBe(201);

    // List bookmarks
    const listRes = await request(app).get('/api/bookmarks');
    expect(listRes.status).toBe(200);
    expect(listRes.body.bookmarks.some((b: any) => b.id === bookmarkedId)).toBe(true);

    // Delete bookmark
    const delRes = await request(app).delete(`/api/bookmarks/${bookmarkedId}`);
    expect(delRes.status).toBe(200);
  }, 15000);
});

describe('Authentication API (User and Guest Login)', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test Reader',
  };

  it('creates guest session with unique guestId', async () => {
    const res = await request(app).post('/api/auth/guest').send({});
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('guest');
    expect(res.body.guestId).toMatch(/^guest-/);
  });

  it('registers a new user and returns JWT token', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.role).toBe('user');
  });

  it('rejects registration with duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('logs in registered user with correct password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('authenticates session via /api/auth/me with Bearer token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testUser.email.toLowerCase());
    expect(meRes.body.user.role).toBe('user');
  });
});
