import { logger } from "@/lib/logger";
import { RetryManager, RetryConfigs } from "./retry-manager";

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface ErrorHandlerOptions {
  shouldRetry?: boolean;
  retryConfig?: keyof typeof RetryConfigs;
  shouldNotify?: boolean;
  shouldLog?: boolean;
  fallbackValue?: any;
  customHandler?: (error: Error, context: ErrorContext) => Promise<any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: ErrorContext) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: ErrorContext) {
    super(message, 'NOT_FOUND_ERROR', 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', context?: ErrorContext) {
    super(message, 'CONFLICT_ERROR', 409, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service: string, context?: ErrorContext) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'DATABASE_ERROR', 500, true, context);
  }
}

export class QueueError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'QUEUE_ERROR', 500, true, context);
  }
}

export class EmailError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'EMAIL_ERROR', 500, true, context);
  }
}

export class FileError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'FILE_ERROR', 500, true, context);
  }
}

export class ErrorHandler {
  private static notificationHandlers: Array<(error: AppError) => Promise<void>> = [];

  /**
   * Register a notification handler for errors
   */
  static registerNotificationHandler(handler: (error: AppError) => Promise<void>) {
    this.notificationHandlers.push(handler);
  }

  /**
   * Handle an error with comprehensive error handling
   */
  static async handle<T>(
    error: Error,
    context: ErrorContext,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    const {
      shouldRetry = false,
      retryConfig = 'network',
      shouldNotify = true,
      shouldLog = true,
      fallbackValue = null,
      customHandler,
    } = options;

    // Convert to AppError if needed
    const appError = this.normalizeError(error, context);

    // Log the error
    if (shouldLog) {
      this.logError(appError, context);
    }

    // Try custom handler first
    if (customHandler) {
      try {
        const result = await customHandler(appError, context);
        return result;
      } catch (customError) {
        logger.error("Custom error handler failed", "error-handler", {
          originalError: appError.message,
          customHandlerError: customError instanceof Error ? customError.message : customError,
          context,
        });
      }
    }

    // Send notifications if needed
    if (shouldNotify && appError.statusCode >= 500) {
      await this.notifyError(appError);
    }

    // Return fallback value
    return fallbackValue;
  }

  /**
   * Handle an error with retry logic
   */
  static async handleWithRetry<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    const {
      retryConfig = 'network',
      shouldNotify = true,
      shouldLog = true,
      fallbackValue = null,
    } = options;

    try {
      const result = await RetryManager.execute(
        fn,
        RetryConfigs[retryConfig],
        context.operation
      );

      if (result.success) {
        return result.result!;
      } else {
        return await this.handle(result.error!, context, {
          ...options,
          shouldRetry: false, // Already retried
        });
      }
    } catch (error) {
      return await this.handle(error as Error, context, {
        ...options,
        shouldRetry: false, // Already retried
      });
    }
  }

  /**
   * Wrap a function with comprehensive error handling
   */
  static wrapFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: Partial<ErrorContext>,
    options: ErrorHandlerOptions = {}
  ): (...args: T) => Promise<R | null> {
    return async (...args: T): Promise<R | null> => {
      const fullContext: ErrorContext = {
        ...context,
        operation: context.operation || fn.name,
      };

      if (options.shouldRetry) {
        return await this.handleWithRetry(() => fn(...args), fullContext, options);
      } else {
        try {
          return await fn(...args);
        } catch (error) {
          return await this.handle(error as Error, fullContext, options);
        }
      }
    };
  }

  /**
   * Handle async operations with comprehensive error handling
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: ErrorHandlerOptions = {}
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      let result: T;

      if (options.shouldRetry) {
        const retryResult = await RetryManager.execute(
          operation,
          RetryConfigs[options.retryConfig || 'network'],
          context.operation
        );

        if (retryResult.success) {
          result = retryResult.result!;
        } else {
          throw retryResult.error!;
        }
      } else {
        result = await operation();
      }

      return { success: true, data: result };
    } catch (error) {
      const appError = this.normalizeError(error as Error, context);
      
      await this.handle(appError, context, {
        ...options,
        shouldRetry: false, // Already handled retry above
      });

      return { success: false, error: appError };
    }
  }

  /**
   * Convert any error to AppError
   */
  private static normalizeError(error: Error, context: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Check for specific error types and convert
    if (error.message.includes('validation')) {
      return new ValidationError(error.message, context);
    }

    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return new AuthenticationError(error.message, context);
    }

    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return new AuthorizationError(error.message, context);
    }

    if (error.message.includes('not found')) {
      return new NotFoundError(error.message, context);
    }

    if (error.message.includes('conflict') || error.message.includes('duplicate')) {
      return new ConflictError(error.message, context);
    }

    if (error.message.includes('rate limit')) {
      return new RateLimitError(error.message, context);
    }

    if (error.message.includes('database') || error.message.includes('sql')) {
      return new DatabaseError(error.message, context);
    }

    if (error.message.includes('queue')) {
      return new QueueError(error.message, context);
    }

    if (error.message.includes('email') || error.message.includes('smtp')) {
      return new EmailError(error.message, context);
    }

    if (error.message.includes('file') || error.message.includes('ENOENT')) {
      return new FileError(error.message, context);
    }

    // Default to generic AppError
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, true, context);
  }

  /**
   * Log error with appropriate level and context
   */
  private static logError(error: AppError, context: ErrorContext) {
    const logData = {
      errorCode: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      timestamp: error.timestamp,
      stack: error.stack,
      context,
    };

    if (error.statusCode >= 500) {
      logger.error(error.message, "error-handler", logData);
    } else if (error.statusCode >= 400) {
      logger.warn(error.message, "error-handler", logData);
    } else {
      logger.info(error.message, "error-handler", logData);
    }
  }

  /**
   * Send error notifications
   */
  private static async notifyError(error: AppError) {
    for (const handler of this.notificationHandlers) {
      try {
        await handler(error);
      } catch (notificationError) {
        logger.error("Error notification handler failed", "error-handler", {
          originalError: error.message,
          notificationError: notificationError instanceof Error 
            ? notificationError.message 
            : notificationError,
        });
      }
    }
  }

  /**
   * Check if error is operational (expected) or programming error
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Get error response for API
   */
  static getErrorResponse(error: AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          context: error.context,
        }),
      },
    };
  }
}

// Utility functions for common error handling patterns
export const handleAsync = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Partial<ErrorContext> = {},
  options: ErrorHandlerOptions = {}
) => ErrorHandler.wrapFunction(fn, context, options);

export const safeAsync = <T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  options: ErrorHandlerOptions = {}
) => ErrorHandler.safeExecute(operation, context, options);

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: Partial<ErrorContext> = {}
) => ErrorHandler.wrapFunction(fn, context, { shouldRetry: true, shouldLog: true });

// All error types are already exported above