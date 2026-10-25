import { ingestionService } from '../services/ingestionService.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let intervalId: NodeJS.Timeout | null = null;

export function startIngestionJob(): void {
  const intervalMs = config.ingestionIntervalMinutes * 60 * 1000;
  logger.info(`Starting background news ingestion job every ${config.ingestionIntervalMinutes} minutes.`);

  // Trigger initial pass shortly after startup (1 second delay to let server initialize)
  setTimeout(async () => {
    try {
      logger.info('Executing initial news ingestion on startup...');
      await ingestionService.ingestNews();
    } catch (err: any) {
      logger.warn(`Startup ingestion encounter: ${err.message}`);
    }
  }, 1000);

  // Set recurring interval
  intervalId = setInterval(async () => {
    try {
      logger.info('Executing scheduled periodic news ingestion...');
      await ingestionService.ingestNews();
    } catch (err: any) {
      logger.error(`Scheduled news ingestion error: ${err.message}`);
    }
  }, intervalMs);
}

export function stopIngestionJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Stopped background news ingestion job.');
  }
}
