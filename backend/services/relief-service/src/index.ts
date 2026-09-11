import express from 'express';
import cors from 'cors';
import { createLogger, getSupabaseClient, createHealthCheckHandler } from '@civicguard/shared';
import reliefRoutes from './routes/relief.routes';
import { config } from './config';

const logger = createLogger('ReliefService');
const app = express();
const supabase = getSupabaseClient();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standardized Health Check (ADR-015)
app.get('/health', createHealthCheckHandler('relief-service', supabase));

// Routes mounted at both /api/relief and / for Kong flexibility
app.use('/api/relief', reliefRoutes);
app.use('/', reliefRoutes);

const server = app.listen(config.port, () => {
  logger.info(`Relief Service running on port ${config.port}`);
});

// Graceful Termination Handler (ADR-015)
const handleShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Gracefully closing Relief Service...`);
  server.close(() => {
    logger.info('HTTP server closed cleanly. Exiting.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Shutdown timeout reached (10s). Forcing termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
