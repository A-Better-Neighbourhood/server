/** @format */

import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    error: string,
    statusCode = 500,
    data?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, error: string, data?: any): Response {
    return this.error(res, error, 400, data);
  }

  static unauthorized(res: Response, error = "Unauthorized"): Response {
    return this.error(res, error, 401);
  }

  static forbidden(res: Response, error = "Forbidden"): Response {
    return this.error(res, error, 403);
  }

  static notFound(res: Response, error = "Resource not found"): Response {
    return this.error(res, error, 404);
  }

  static tooManyRequests(
    res: Response,
    error = "Rate limit exceeded"
  ): Response {
    return this.error(res, error, 429);
  }

  static serverError(res: Response, error = "Internal server error"): Response {
    return this.error(res, error, 500);
  }
}
