export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private format(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}${metaStr}`;
  }

  info(message: string, meta?: any): void {
    console.log(this.format('info', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.format('warn', message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.format('error', message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      console.debug(this.format('debug', message, meta));
    }
  }
}

export const createLogger = (serviceName: string) => new Logger(serviceName);
