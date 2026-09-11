import { Server } from 'socket.io';
import { getSupabaseClient, createLogger, SocketBroadcastDTO, Notification } from '@civicguard/shared';

const logger = createLogger('NotificationService');

export class NotificationService {
  private io: Server;
  private supabase = getSupabaseClient();

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Broadcasts real-time events to Socket.IO rooms and persists to database.
   */
  async broadcast(dto: SocketBroadcastDTO): Promise<void> {
    const { rooms, event, payload, persistForUsers } = dto;

    // 1. Emit to target rooms
    for (const room of rooms) {
      this.io.to(room).emit(event, payload);
      logger.debug(`Emitted event "${event}" to room "${room}"`);
    }

    // 2. Persist notification records in Supabase if requested
    if (persistForUsers && persistForUsers.length > 0) {
      const records = persistForUsers.map((p) => ({
        user_id: p.user_id,
        incident_id: p.incident_id || null,
        ticket_id: p.ticket_id || null,
        notification_type: p.notification_type,
        title: p.title,
        message: p.message,
        is_read: false,
      }));

      const { error } = await this.supabase.from('notifications').insert(records);
      if (error) {
        logger.error(`Error persisting notifications to DB: ${error.message}`);
      }
    }
  }

  /**
   * Retrieves user notification inbox with unread count.
   */
  async getUserNotifications(userId: string, limit: number = 30): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const { data: notifications, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const { count: unreadCount } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return {
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    };
  }

  /**
   * Marks a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Marks all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  /**
   * Returns active urgent alerts for live UI banners.
   */
  async getActiveAlerts(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*, incidents(*)')
      .in('notification_type', ['AREA_ALERT', 'INCIDENT_CONFIRMED'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }
}
