import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: any,
  data?: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: any,
  error: string,
  statusCode: number = 400,
  details?: any
): void {
  const response: ApiResponse = {
    success: false,
    error,
    details,
  };
  res.status(statusCode).json(response);
}
