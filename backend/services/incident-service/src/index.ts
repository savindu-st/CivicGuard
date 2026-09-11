import express from 'express';
import cors from 'cors';
import { createLogger, getSupabaseClient, createHealthCheckHandler } from '@civicguard/shared';
import incidentRoutes from './routes/incident.routes';
import { config } from './config';
import { WeatherSimulator } from './simulators/weatherSimulator';

const logger = createLogger('IncidentService');
const app = express();
const supabase = getSupabaseClient();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standardized Health Check (ADR-015)
app.get('/health', createHealthCheckHandler('incident-service', supabase));

// Routes mounted at both /api/incidents and / for Kong flexibility
app.use('/api/incidents', incidentRoutes);
app.use('/', incidentRoutes);

// Optional background telemetry ticker (ADR aligned)
if (config.simulateTelemetry) {
  logger.info('Background telemetry simulator enabled (running every 5 minutes)...');
  const simulator = new WeatherSimulator();
  setInterval(() => {
    simulator.simulateStormBurst('MODERATE').catch((e) => logger.warn(`Ticker error: ${e.message}`));
  }, 5 * 60 * 1000);
}

const server = app.listen(config.port, () => {
  logger.info(`Incident Service running on port ${config.port}`);
});

// Graceful Draining & Termination (ADR-015)
const handleShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Gracefully draining connections...`);
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
