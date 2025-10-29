/**
 * Standardized error response utilities for consistent API error handling
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";
import { ApiError, ErrorType } from "./api-utils";

/**
 * Standard API response interface
 */
export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    version?: string;
    timestamp: string;
    message?: string;
  };
}

/**
 * Error response builder for consistent API error responses
 */
export class StandardErrorResponse {
  /**
   * Create a standardized error response
   */
  static create(
    message: string,
    code: string = ErrorType.INTERNAL,
    statusCode: number = 500,
    details?: any,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    const errorResponse: StandardApiResponse = {
      success: false,
      error: {
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    // Log the error
    logger.apiError(
      "API Error Response",
      "api",
      { message, code, statusCode, details },
      { requestId },
    );

    return NextResponse.json(errorResponse, { status: statusCode });
  }

  /**
   * Handle validation errors from Zod
   */
  static validation(
    zodError: ZodError,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    const validationErrors = zodError.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
      received: "received" in err ? err.received : undefined,
    }));

    return this.create(
      "Validation failed",
      ErrorType.VALIDATION,
      400,
      { validationErrors },
      requestId,
    );
  }

  /**
   * Create bad request error response
   */
  static badRequest(
    message: string,
    _context?: string,
    details?: any,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(message, ErrorType.VALIDATION, 400, details, requestId);
  }

  /**
   * Handle authentication errors
   */
  static unauthorized(
    message: string = "Authentication required",
    _context?: string,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(
      message,
      ErrorType.AUTHENTICATION,
      401,
      undefined,
      requestId,
    );
  }

  /**
   * Handle authorization errors
   */
  static forbidden(
    message: string = "Insufficient permissions",
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(
      message,
      ErrorType.AUTHORIZATION,
      403,
      undefined,
      requestId,
    );
  }

  /**
   * Handle not found errors
   */
  static notFound(
    resource: string = "Resource",
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(
      `${resource} not found`,
      ErrorType.NOT_FOUND,
      404,
      undefined,
      requestId,
    );
  }

  /**
   * Handle conflict errors
   */
  static conflict(
    message: string,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(message, ErrorType.CONFLICT, 409, undefined, requestId);
  }

  /**
   * Handle rate limit errors
   */
  static rateLimit(
    message: string = "Rate limit exceeded",
    retryAfter?: number,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    const response = this.create(
      message,
      ErrorType.RATE_LIMIT,
      429,
      { retryAfter },
      requestId,
    );

    if (retryAfter) {
      response.headers.set("Retry-After", retryAfter.toString());
    }

    return response;
  }

  /**
   * Handle internal server errors
   */
  static internal(
    message: string = "Internal server error",
    details?: any,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(message, ErrorType.INTERNAL, 500, details, requestId);
  }

  /**
   * Handle external service errors
   */
  static externalService(
    serviceName: string,
    message?: string,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(
      message || `External service ${serviceName} is unavailable`,
      ErrorType.EXTERNAL_SERVICE,
      502,
      { service: serviceName },
      requestId,
    );
  }

  /**
   * Handle timeout errors
   */
  static timeout(
    operation: string,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(
      `Operation ${operation} timed out`,
      ErrorType.TIMEOUT,
      504,
      { operation },
      requestId,
    );
  }

  /**
   * Convert ApiError to standardized response
   */
  static fromApiError(
    error: ApiError,
    requestId?: string,
  ): NextResponse<StandardApiResponse> {
    return this.create(
      error.message,
      error.code,
      error.statusCode,
      error.details,
      requestId,
    );
  }
}

/**
 * Success response builder for consistent API success responses
 */
export class StandardSuccessResponse {
  /**
   * Create a standardized success response
   */
  static create<T>(
    data: T,
    meta?: any,
    statusCode: number = 200,
  ): NextResponse<StandardApiResponse<T>> {
    const successResponse: StandardApiResponse<T> = {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(successResponse, { status: statusCode });
  }

  /**
   * Create paginated success response
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string,
  ): NextResponse<StandardApiResponse<T[]>> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return this.create(data, {
      message,
      pagination: {
        ...pagination,
        totalPages,
      },
    });
  }

  /**
   * Create OK success response (200)
   */
  static ok<T>(
    data: T,
    requestId?: string,
    meta?: any,
  ): NextResponse<StandardApiResponse<T>> {
    return this.create(data, { ...meta, requestId }, 200);
  }

  /**
   * Create created resource response
   */
  static created<T>(
    data: T,
    requestId?: string,
    meta?: any,
  ): NextResponse<StandardApiResponse<T>> {
    return this.create(
      data,
      {
        ...meta,
        requestId,
        message: meta?.message || "Resource created successfully",
      },
      201,
    );
  }

  /**
   * Create updated resource response
   */
  static updated<T>(
    data: T,
    requestId?: string,
    meta?: any,
  ): NextResponse<StandardApiResponse<T>> {
    return this.create(
      data,
      {
        ...meta,
        requestId,
        message: meta?.message || "Resource updated successfully",
      },
      200,
    );
  }

  /**
   * Create deleted resource response
   */
  static deleted(
    requestId?: string,
    meta?: any,
  ): NextResponse<StandardApiResponse<null>> {
    return this.create(
      null,
      {
        ...meta,
        requestId,
        message: meta?.message || "Resource deleted successfully",
      },
      200,
    );
  }

  /**
   * Create no content response
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * Middleware for standardizing error responses
 */
export function withStandardErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: string,
) {
  return async (...args: T): Promise<R | NextResponse<StandardApiResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      const requestId = crypto.randomUUID();

      // Handle known error types
      if (error instanceof ApiError) {
        return StandardErrorResponse.fromApiError(error, requestId);
      }

      if (error instanceof ZodError) {
        return StandardErrorResponse.validation(error, requestId);
      }

      // Handle unknown errors
      logger.error("Unhandled error in API route", context || "API", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        requestId,
      });

      return StandardErrorResponse.internal(
        "An unexpected error occurred",
        process.env.NODE_ENV === "development"
          ? {
              originalError: error instanceof Error ? error.message : error,
              stack: error instanceof Error ? error.stack : undefined,
            }
          : undefined,
        requestId,
      );
    }
  };
}

/**
 * Utility functions for error response handling
 */
export const errorResponseUtils = {
  /**
   * Extract error information from response
   */
  extractErrorInfo(response: StandardApiResponse): {
    message: string;
    code: string;
    details?: any;
  } | null {
    if (!response.error) return null;

    return {
      message: response.error.message,
      code: response.error.code,
      details: response.error.details,
    };
  },

  /**
   * Check if response is an error
   */
  isErrorResponse(response: StandardApiResponse): boolean {
    return !response.success && !!response.error;
  },

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(response: StandardApiResponse): string {
    if (!response.error) return "Unknown error";

    const errorMessages: Record<string, string> = {
      [ErrorType.VALIDATION]: "The provided data is not valid",
      [ErrorType.AUTHENTICATION]: "You must log in to continue",
      [ErrorType.AUTHORIZATION]: "You don't have permission to perform this action",
      [ErrorType.NOT_FOUND]: "The requested resource was not found",
      [ErrorType.CONFLICT]: "Conflict with the current state of the resource",
      [ErrorType.RATE_LIMIT]: "You have exceeded the request limit",
      [ErrorType.INTERNAL]: "Internal server error",
      [ErrorType.EXTERNAL_SERVICE]: "External service unavailable",
      [ErrorType.TIMEOUT]: "The operation took too long",
    };

    return errorMessages[response.error.code] || response.error.message;
  },
};
