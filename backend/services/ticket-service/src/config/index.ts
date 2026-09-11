import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.TICKET_SERVICE_PORT || process.env.PORT || '4002', 10),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  incidentServiceUrl: process.env.INCIDENT_SERVICE_URL || 'http://incident-service:4001',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4003',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_civicguard_jwt_token_key_change_me_32char',
  storageResolutionBucket: process.env.SUPABASE_STORAGE_RESOLUTION_BUCKET || 'resolution-photos',
};
