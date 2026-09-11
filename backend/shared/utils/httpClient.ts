import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createLogger } from './logger';

const logger = createLogger('HTTPClient');

export function createHttpClient(baseURL: string, timeoutMs: number = 5000): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Simple retry mechanism for transient network glitches
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config as AxiosRequestConfig & { _retryCount?: number };
      if (!config) return Promise.reject(error);

      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 2 && (!error.response || error.response.status >= 500)) {
        config._retryCount += 1;
        const delay = Math.pow(2, config._retryCount) * 500;
        logger.warn(
          `RPC to ${config.baseURL}${config.url} failed (${error.message}). Retrying in ${delay}ms (Attempt ${config._retryCount}/2)...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return instance(config);
      }

      return Promise.reject(error);
    }
  );

  return instance;
}
