import { SupabaseClient } from '@supabase/supabase-js';
import { HealthCheckResponse } from '../types';

export function createHealthCheckHandler(serviceName: string, supabase?: SupabaseClient) {
  return async (req: any, res: any) => {
    let dbStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';

    if (supabase) {
      try {
        const { error } = await supabase.from('wards').select('id').limit(1);
        dbStatus = error ? 'disconnected' : 'connected';
      } catch {
        dbStatus = 'disconnected';
      }
    }

    const mem = process.memoryUsage();
    const toMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

    const response: HealthCheckResponse = {
      status: dbStatus === 'disconnected' ? 'degraded' : 'healthy',
      service: serviceName,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      memoryUsage: {
        rss: toMB(mem.rss),
        heapUsed: toMB(mem.heapUsed),
        heapTotal: toMB(mem.heapTotal),
      },
    };

    const statusCode = response.status === 'healthy' ? 200 : 207;
    res.status(statusCode).json(response);
  };
}
