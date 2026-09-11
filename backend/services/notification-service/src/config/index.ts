import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || process.env.PORT || '4003', 10),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_civicguard_jwt_token_key_change_me_32char',
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || '*',
};
