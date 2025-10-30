/**
 * Scheduled Reports Error Handling Middleware
 * 
 * Centralized error handling for scheduled reports API endpoints
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { 
  ScheduledReportError,
  ScheduledReportNotFoundError,
  ScheduledReportValidationError,
  CronValidationError,
  ReportAccessError,
  RecipientValidationError,
  ScheduleConflictError,
  ReportExecutionError,
  EmailDeliveryError
} from '@/lib/types/scheduled-reports';
import { logger } from '@/lib/logger';

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * Handle scheduled reports API errors with appropriate HTTP status codes and responses
 */
export function handleScheduledReportsError(
  error: unknown,
  context: {
    operation: string;
    userId?: string;
    organizationId?: string;
    scheduledReportId?: string;
    path?: string;
  }
): NextResponse<ErrorResponse> {
  const timestamp = new Date().toISOString();
  const { operation, userId, organizationId, scheduledReportId, path } = context;

  // Log the error with context
  logger.error(`Scheduled reports ${operation} error`, 'scheduled-reports-api', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId,
    organizationId,
    scheduledReportId,
    path,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { validationErrors },
        timestamp,
        path,
      },
      { status: 400 }
    );
  }

  // Handle specific scheduled report errors
  if (error instanceof ScheduledReportNotFoundError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        path,
      },
      { status: 404 }
    );
  }

  if (error instanceof ReportAccessError) {
    return NextResponse.json(
      {
        error: 'Access denied',
        code: error.code,
        details: { message: 'You do not have permission to access this report' },
        timestamp,
        path,
      },
      { status: 403 }
    );
  }

  if (error instanceof CronValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        path,
      },
      { status: 400 }
    );
  }

  if (error instanceof RecipientValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        path,
      },
      { status: 400 }
    );
  }

  if (error instanceof ScheduledReportValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        path,
      },
      { status: 400 }
    );
  }

  if (error instanceof ScheduleConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        path,
      },
      { status: 409 }
    );
  }

  if (error instanceof ReportExecutionError) {
    return NextResponse.json(
      {
        error: 'Report execution failed',
        code: error.code,
        details: { message: 'The scheduled report could not be executed. Please try again later.' },
        timestamp,
        path,
      },
      { status: 500 }
    );
  }

  if (error instanceof EmailDeliveryError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        path,
      },
      { status: 207 } // Multi-status - partial success
    );
  }

  // Handle generic ScheduledReportError
  if (error instanceof ScheduledReportError) {
    const statusCode = getStatusCodeForError(error.code);
    
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        path,
      },
      { status: statusCode }
    );
  }

  // Handle database errors
  if (error instanceof Error && error.message.includes('database')) {
    return NextResponse.json(
      {
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
        details: { message: 'A database error occurred. Please try again later.' },
        timestamp,
        path,
      },
      { status: 500 }
    );
  }

  // Handle network/timeout errors
  if (error instanceof Error && (
    error.message.includes('timeout') || 
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED')
  )) {
    return NextResponse.json(
      {
        error: 'Service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE',
        details: { message: 'The service is temporarily unavailable. Please try again later.' },
        timestamp,
        path,
      },
      { status: 503 }
    );
  }

  // Handle unknown errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      details: { 
        message: 'An unexpected error occurred. Please try again later.',
        // Only include error details in development
        ...(process.env.NODE_ENV === 'development' && { originalError: errorMessage })
      },
      timestamp,
      path,
    },
    { status: 500 }
  );
}

/**
 * Get appropriate HTTP status code for error code
 */
function getStatusCodeForError(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'INVALID_CRON_EXPRESSION': 400,
    'INVALID_RECIPIENTS': 400,
    'REPORT_ACCESS_DENIED': 403,
    'SCHEDULED_REPORT_NOT_FOUND': 404,
    'SCHEDULE_CONFLICT': 409,
    'EXECUTION_ERROR': 500,
    'EMAIL_DELIVERY_ERROR': 207,
    'DATABASE_ERROR': 500,
    'SERVICE_UNAVAILABLE': 503,
  };

  return statusMap[errorCode] || 500;
}

/**
 * Validate request authentication and organization access
 */
export function validateRequestAuth(
  userId?: string,
  organizationId?: string
): void {
  if (!userId) {
    throw new ScheduledReportError('Authentication required', 'UNAUTHORIZED');
  }

  if (!organizationId) {
    throw new ScheduledReportValidationError('organizationId', organizationId, 'Organization ID is required');
  }
}

/**
 * Sanitize error details for client response
 */
export function sanitizeErrorDetails(details: any): any {
  if (!details) return undefined;

  // Remove sensitive information
  const sanitized = { ...details };
  
  // Remove stack traces in production
  if (process.env.NODE_ENV === 'production') {
    delete sanitized.stack;
    delete sanitized.originalError;
  }

  // Remove internal database details
  delete sanitized.query;
  delete sanitized.parameters;
  delete sanitized.connection;

  return sanitized;
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>
): NextResponse<{
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, any>;
  timestamp: string;
}> {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: Omit<Parameters<typeof handleScheduledReportsError>[1], 'path'>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw handleScheduledReportsError(error, {
        ...context,
        path: args[0]?.url || 'unknown',
      });
    }
  };
}