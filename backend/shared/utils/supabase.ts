import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Polyfill global WebSocket for Node.js environments (e.g. Node 20 in Docker)
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const clientOptions: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: ws,
    },
  };

  if (!supabaseUrl || !serviceRoleKey) {
    // Provide a fallback mock warning during build or offline tests
    console.warn(
      '[SUPABASE] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Using dummy client placeholder.'
    );
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      serviceRoleKey || 'placeholder-key',
      clientOptions
    );
  }

  supabaseInstance = createClient(supabaseUrl, serviceRoleKey, clientOptions);

  return supabaseInstance;
}
