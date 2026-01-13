import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Error handling middleware for API requests
 */
export class ErrorMiddleware {
  /**
   * Handle and format errors for API responses
   */
  static handleError(error: unknown): NextResponse {
    console.error('API Error:', error);

    // Handle custom application errors
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle standard JavaScript errors
    if (error instanceof Error) {
      // Don't expose internal error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return NextResponse.json(
        {
          error: isDevelopment ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
          ...(isDevelopment && { stack: error.stack }),
        },
        { status: 500 }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }

  /**
   * Middleware wrapper for error handling
   */
  static withErrorHandling() {
    return function (
      handler: (request: NextRequest, context?: any) => Promise<NextResponse>
    ) {
      return async function (
        request: NextRequest,
        context?: any
      ): Promise<NextResponse> {
        try {
          return await handler(request, context);
        } catch (error) {
          return ErrorMiddleware.handleError(error);
        }
      };
    };
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code,
        details,
      },
      { status: statusCode }
    );
  }

  /**
   * Create a validation error response
   */
  static createValidationErrorResponse(errors: any[]): NextResponse {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
      { status: 400 }
    );
  }

  /**
   * Create a not found error response
   */
  static createNotFoundResponse(resource: string = 'Resource'): NextResponse {
    return NextResponse.json(
      {
        error: `${resource} not found`,
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  /**
   * Create an unauthorized error response
   */
  static createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  /**
   * Create a forbidden error response
   */
  static createForbiddenResponse(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  /**
   * Create a conflict error response
   */
  static createConflictResponse(message: string = 'Conflict'): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'CONFLICT',
      },
      { status: 409 }
    );
  }

  /**
   * Create a rate limit error response
   */
  static createRateLimitResponse(message: string = 'Too many requests'): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    );
  }
}

// Common error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

// Error logging utility
export class ErrorLogger {
  static log(error: unknown, context?: any): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    // In production, you might want to send this to a logging service
    console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
  }
}