import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.RELIEF_SERVICE_PORT || process.env.PORT || '4004', 10),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4003',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_civicguard_jwt_token_key_change_me_32char',
};
