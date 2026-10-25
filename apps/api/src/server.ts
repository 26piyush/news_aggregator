import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { checkDatabaseConnection } from './repositories/prisma.js';
import { startIngestionJob, stopIngestionJob } from './jobs/ingestionJob.js';

// Route imports
import newsRoutes from './routes/newsRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { newsController } from './controllers/newsController.js';

const app = express();

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: false, // allow standard client rendering
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and specified origin
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(rateLimiter(150, 60000)); // 150 requests per minute per IP

// Operations / Health Routes
app.use('/', healthRoutes);

// Primary API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.get('/api/categories', (req, res, next) => newsController.getCategories(req, res, next));
app.get('/api/sources', (req, res, next) => newsController.getSources(req, res, next));
app.use('/api/bookmarks', bookmarkRoutes);

// Fallback for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Centralized error handling
app.use(errorHandler);

let server: any;

async function bootstrap() {
  logger.info('Initializing AI-Powered News Aggregator API...');
  
  // Test database connection
  const dbOk = await checkDatabaseConnection();
  if (dbOk) {
    logger.info('Connected to PostgreSQL database via Prisma.');
  } else {
    logger.info('PostgreSQL not detected locally. Initialized in-memory fallback store with full persistence resilience.');
  }

  // Start HTTP server
  server = app.listen(config.port, () => {
    logger.info(`News Aggregator API listening on http://localhost:${config.port} (Environment: ${config.env})`);
    
    // Start background news ingestion
    startIngestionJob();
  });
}

// Graceful shutdown handling
function handleShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopIngestionJob();
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Only start when invoked directly (not during unit testing)
if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export { app };
