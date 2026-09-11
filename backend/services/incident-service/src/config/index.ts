import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.INCIDENT_SERVICE_PORT || process.env.PORT || '4001', 10),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://ai-service:5000',
  ticketServiceUrl: process.env.TICKET_SERVICE_URL || 'http://ticket-service:4002',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4003',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_civicguard_jwt_token_key_change_me_32char',
  simulateTelemetry: process.env.SIMULATE_TELEMETRY === 'true',
  storageIncidentBucket: process.env.SUPABASE_STORAGE_INCIDENT_BUCKET || 'incident-photos',
};
