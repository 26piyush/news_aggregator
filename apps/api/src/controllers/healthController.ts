import { Request, Response } from 'express';
import { isDatabaseConnected, checkDatabaseConnection } from '../repositories/prisma.js';
import { cacheService } from '../services/cacheService.js';
import { config } from '../config/env.js';
import axios from 'axios';

export class HealthController {
  async health(req: Request, res: Response): Promise<void> {
    const dbOk = await checkDatabaseConnection();
    const redisOk = await cacheService.isHealthy();

    let nlpOk = false;
    try {
      const nlpRes = await axios.get(`${config.nlpServiceUrl}/health`, { timeout: 1500 });
      nlpOk = nlpRes.status === 200;
    } catch {
      nlpOk = false;
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          connected: dbOk,
          engine: dbOk ? 'PostgreSQL (Prisma)' : 'In-Memory Resilient Store (Active)',
        },
        caching: {
          healthy: redisOk,
          mode: cacheService.getMode(),
        },
        nlpService: {
          reachable: nlpOk,
          url: config.nlpServiceUrl,
          fallbackActive: !nlpOk,
        },
      },
    });
  }

  async ready(req: Request, res: Response): Promise<void> {
    res.json({ status: 'ready' });
  }
}

export const healthController = new HealthController();
