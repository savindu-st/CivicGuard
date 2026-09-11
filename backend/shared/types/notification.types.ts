export type NotificationType = 
  | 'AREA_ALERT'
  | 'INCIDENT_CONFIRMED'
  | 'TICKET_ASSIGNED'
  | 'CREW_DISPATCHED'
  | 'INCIDENT_RESOLVED'
  | 'HELP_REQUEST_UPDATED'
  | 'NEED_MORE_INFO';

export interface Notification {
  id: string;
  user_id: string;
  incident_id?: string | null;
  ticket_id?: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}

export interface SocketBroadcastDTO {
  rooms: string[];
  event: string;
  payload: Record<string, any>;
  persistForUsers?: Array<{
    user_id: string;
    incident_id?: string;
    ticket_id?: string;
    notification_type: NotificationType;
    title: string;
    message: string;
  }>;
}
