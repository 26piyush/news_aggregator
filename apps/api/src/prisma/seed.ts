import { PrismaClient } from '@prisma/client';
import { MOCK_ARTICLES } from '../providers/mockAdapter.js';
import { nlpClientService } from '../services/nlpClientService.js';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting Prisma database seeding...');

  try {
    // 1. Seed News Sources
    for (const art of MOCK_ARTICLES) {
      const source = await prisma.newsSource.upsert({
        where: { name: art.sourceName },
        update: {
          domain: art.sourceDomain,
          provider: art.provider,
        },
        create: {
          name: art.sourceName,
          domain: art.sourceDomain,
          provider: art.provider,
          homepageUrl: art.sourceDomain ? `https://${art.sourceDomain}` : null,
        },
      });

      // 2. Seed Articles
      const stored = await prisma.article.upsert({
        where: { canonicalUrl: art.canonicalUrl },
        update: {
          title: art.title,
          description: art.description,
          content: art.content,
          imageUrl: art.imageUrl,
          category: art.category,
          publishedAt: art.publishedAt,
        },
        create: {
          providerArticleId: art.providerArticleId,
          title: art.title,
          description: art.description,
          content: art.content,
          canonicalUrl: art.canonicalUrl,
          imageUrl: art.imageUrl,
          author: art.author,
          sourceId: source.id,
          category: art.category,
          publishedAt: art.publishedAt,
        },
      });

      // 3. Seed AI Analysis
      const analysis = await nlpClientService.analyze({
        id: stored.id,
        title: stored.title,
        description: stored.description,
        content: stored.content,
      });

      await prisma.articleAnalysis.upsert({
        where: { articleId: stored.id },
        update: {
          readabilityScore: analysis.readability.score,
          qualityScore: analysis.qualityScore,
        },
        create: {
          articleId: stored.id,
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
    }

    logger.info('Database seeding completed successfully.');
  } catch (err: any) {
    logger.warn(`Database seeding note (database may be offline in local dev mode): ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
