import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // Provide a fallback mock warning during build or offline tests
    console.warn(
      '[SUPABASE] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Using dummy client placeholder.'
    );
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      serviceRoleKey || 'placeholder-key'
    );
  }

  supabaseInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseInstance;
}
