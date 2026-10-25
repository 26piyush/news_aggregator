import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';

let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
} catch (err: any) {
  logger.warn(`Prisma client failed to instantiate: ${err.message}`);
  prisma = new PrismaClient();
}

let dbConnected = false;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    return true;
  } catch (err: any) {
    dbConnected = false;
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return dbConnected;
}

export { prisma };
