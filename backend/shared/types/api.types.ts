export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  uptime: number;
  timestamp: string;
  database: 'connected' | 'disconnected' | 'unknown';
  memoryUsage: {
    rss: string;
    heapUsed: string;
    heapTotal: string;
  };
  details?: Record<string, any>;
}
