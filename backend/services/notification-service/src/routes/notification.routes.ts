import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';

export function createNotificationRouter(service: NotificationService): Router {
  const router = Router();
  const controller = new NotificationController(service);

  router.post('/broadcast', controller.broadcast);
  router.get('/user/:userId', controller.getUserNotifications);
  router.patch('/:id/read', controller.markAsRead);
  router.patch('/user/:userId/read-all', controller.markAllAsRead);
  router.get('/active-alerts', controller.getActiveAlerts);

  return router;
}
