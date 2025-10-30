// Error Handler exports
export {
  ErrorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  QueueError,
  EmailError,
  FileError,
  handleAsync,
  safeAsync,
  withErrorHandling,
  type ErrorContext,
  type ErrorHandlerOptions,
} from './error-handler';

// Retry Manager exports
export {
  RetryManager,
  RetryConfigs,
  withRetry,
  type RetryOptions,
  type RetryResult,
} from './retry-manager';

// Common error handling patterns
export const ErrorPatterns = {
  // API route error handling
  apiRoute: {
    shouldRetry: false,
    shouldLog: true,
    shouldNotify: true,
  },

  // Background job error handling
  backgroundJob: {
    shouldRetry: true,
    retryConfig: 'critical' as const,
    shouldLog: true,
    shouldNotify: true,
  },

  // External service integration
  externalService: {
    shouldRetry: true,
    retryConfig: 'network' as const,
    shouldLog: true,
    shouldNotify: false,
  },

  // Database operations
  database: {
    shouldRetry: true,
    retryConfig: 'database' as const,
    shouldLog: true,
    shouldNotify: true,
  },

  // Email operations
  email: {
    shouldRetry: true,
    retryConfig: 'email' as const,
    shouldLog: true,
    shouldNotify: false,
  },

  // File operations
  file: {
    shouldRetry: true,
    retryConfig: 'file' as const,
    shouldLog: true,
    shouldNotify: false,
  },

  // User-facing operations (minimal retry, no notifications)
  userFacing: {
    shouldRetry: false,
    shouldLog: true,
    shouldNotify: false,
  },
} as const;