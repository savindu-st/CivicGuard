import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createLogger, getSupabaseClient, createHealthCheckHandler } from '@civicguard/shared';
import { setupSocketHandler } from './socket/socketHandler';
import { NotificationService } from './services/notification.service';
import { createNotificationRouter } from './routes/notification.routes';
import { config } from './config';

const logger = createLogger('NotificationService');
const app = express();
const supabase = getSupabaseClient();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

// Socket.IO Server Configuration
const io = new Server(server, {
  cors: {
    origin: config.socketCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup Socket handler with JWT handshake authentication
setupSocketHandler(io);

// Setup Notification service & routes
const notificationService = new NotificationService(io);
const notificationRouter = createNotificationRouter(notificationService);

// Standardized Health Check (ADR-015)
app.get('/health', async (req, res) => {
  const baseHealth = createHealthCheckHandler('notification-service', supabase);
  // Enhance with active socket connection count
  const socketCount = io.sockets.sockets.size;
  res.status(200).json({
    status: 'healthy',
    service: 'notification-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeSockets: socketCount,
  });
});

app.use('/api/notifications', notificationRouter);
app.use('/', notificationRouter);

server.listen(config.port, () => {
  logger.info(`Notification Service & Socket.IO running on port ${config.port}`);
});

// Graceful Termination Handler (ADR-015)
const handleShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Gracefully closing WebSocket connections and server...`);
  io.close(() => {
    logger.info('All socket connections closed.');
  });
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
