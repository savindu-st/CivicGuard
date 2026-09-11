import { Request, Response } from 'express';
import { sendSuccess, sendError, SocketBroadcastDTO } from '@civicguard/shared';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  private service: NotificationService;

  constructor(service: NotificationService) {
    this.service = service;
  }

  broadcast = async (req: Request, res: Response): Promise<void> => {
    try {
      const body: SocketBroadcastDTO = req.body;
      if (!body.rooms || !body.event || !body.payload) {
        sendError(res, 'rooms, event, and payload are required', 400);
        return;
      }

      await this.service.broadcast(body);
      sendSuccess(res, null, `Event ${body.event} broadcasted to rooms [${body.rooms.join(', ')}]`);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const result = await this.service.getUserNotifications(userId, limit ? Number(limit) : 30);
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.markAsRead(req.params.id);
      sendSuccess(res, null, 'Notification marked as read');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.markAllAsRead(req.params.userId);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getActiveAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const alerts = await this.service.getActiveAlerts();
      sendSuccess(res, { alerts });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };
}
