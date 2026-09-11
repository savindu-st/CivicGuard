import { Server, Socket } from 'socket.io';
import { verifyToken, createLogger, JwtUserPayload } from '@civicguard/shared';

const logger = createLogger('SocketHandler');

export function setupSocketHandler(io: Server): void {
  // Middleware to authenticate JWT on connection handshake (ADR-004)
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string);

    if (token) {
      try {
        const payload: JwtUserPayload = verifyToken(token);
        (socket as any).user = payload;
        logger.info(`Socket authenticated: User ${payload.userId} (${payload.roles.join(', ')})`);
      } catch (err: any) {
        logger.warn(`Invalid socket handshake token: ${err.message}. Proceeding as anonymous.`);
      }
    } else {
      logger.debug('Socket connected anonymously (public access).');
    }

    next();
  });

  io.on('connection', (socket: Socket) => {
    const user: JwtUserPayload | undefined = (socket as any).user;

    // 1. All sockets automatically join the public stream
    socket.join('public');

    // 2. Authenticated user auto-joins personal and role-specific channels
    if (user) {
      socket.join(`user:${user.userId}`);

      if (user.roles.includes('COUNCIL_OFFICER') || user.roles.includes('SYSTEM_ADMIN')) {
        socket.join('officers');
      }
      if (user.roles.includes('FIELD_CREW')) {
        socket.join('crews');
      }
      if (user.roles.includes('RELIEF_COORDINATOR')) {
        socket.join('relief');
      }
    }

    // 3. Dynamic room subscription listeners
    socket.on('subscribe:ward', (wardId: string) => {
      if (wardId) {
        socket.join(`ward:${wardId}`);
        logger.debug(`Socket ${socket.id} subscribed to ward:${wardId}`);
      }
    });

    socket.on('unsubscribe:ward', (wardId: string) => {
      if (wardId) {
        socket.leave(`ward:${wardId}`);
      }
    });

    socket.on('subscribe:crew', (crewId: string) => {
      if (crewId) {
        socket.join(`crew:${crewId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected (${socket.id}): ${reason}`);
    });
  });
}
