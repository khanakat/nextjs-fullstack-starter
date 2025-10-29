import { logger } from "./logger";

/**
 * Client-side error handling utilities
 */

/**
 * Error boundary error info interface
 */
export interface ErrorInfo {
  componentStack?: string | null | undefined;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

/**
 * Client error interface
 */
export interface ClientError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  componentStack?: string;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories for client-side errors
 */
export enum ClientErrorType {
  NETWORK = "NETWORK_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  COMPONENT = "COMPONENT_ERROR",
  ASYNC = "ASYNC_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

/**
 * Enhanced error class for client-side errors
 */
export class ClientApiError extends Error {
  code: string;
  severity: ErrorSeverity;
  context?: any;
  timestamp: string;

  constructor(
    message: string,
    code: string = ClientErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: any,
  ) {
    super(message);
    this.name = "ClientApiError";
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, ClientApiError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Error handlers for common scenarios
 */
export const handleError = {
  network: (error: any, context?: string) => {
    const message = error.message || "Network request failed";
    const clientError = new ClientApiError(
      message,
      ClientErrorType.NETWORK,
      ErrorSeverity.HIGH,
      { context, originalError: error },
    );

    logger.error("Network Error", "CLIENT", clientError.toJSON());
    return clientError;
  },

  validation: (error: any, field?: string) => {
    const message = error.message || "Validation failed";
    const clientError = new ClientApiError(
      message,
      ClientErrorType.VALIDATION,
      ErrorSeverity.LOW,
      { field, originalError: error },
    );

    logger.warn("Validation Error", "CLIENT", clientError.toJSON());
    return clientError;
  },

  authentication: (error: any) => {
    const message = error.message || "Authentication failed";
    const clientError = new ClientApiError(
      message,
      ClientErrorType.AUTHENTICATION,
      ErrorSeverity.HIGH,
      { originalError: error },
    );

    logger.error("Authentication Error", "CLIENT", clientError.toJSON());
    return clientError;
  },

  component: (error: Error, componentName?: string, errorInfo?: ErrorInfo) => {
    const clientError = new ClientApiError(
      `Component error in ${componentName || "Unknown"}: ${error.message}`,
      ClientErrorType.COMPONENT,
      ErrorSeverity.HIGH,
      {
        componentName,
        componentStack: errorInfo?.componentStack || "",
        stack: error.stack,
      },
    );

    logger.error("Component error", "CLIENT", clientError.toJSON());
    return clientError;
  },

  async: (error: any, operation?: string) => {
    const message = error.message || "Async operation failed";
    const clientError = new ClientApiError(
      message,
      ClientErrorType.ASYNC,
      ErrorSeverity.MEDIUM,
      { operation, originalError: error },
    );

    logger.error("Async Error", "CLIENT", clientError.toJSON());
    return clientError;
  },
};

/**
 * Error recovery strategies
 */
export const errorRecovery = {
  retry: async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    backoff: boolean = true,
  ): Promise<T> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        logger.warn(
          `Operation failed, retrying in ${waitTime}ms (attempt ${attempt}/${maxAttempts})`,
          "CLIENT",
          {
            error: error instanceof Error ? error.message : error,
            attempt,
            maxAttempts,
            waitTime,
          },
        );

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw handleError.async(lastError, "retry operation");
  },

  fallback: async <T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context?: string,
  ): Promise<T> => {
    try {
      return await primary();
    } catch (error) {
      logger.warn(
        `Primary operation failed, using fallback: ${context}`,
        "CLIENT",
        {
          error: error instanceof Error ? error.message : error,
        },
      );

      try {
        return await fallback();
      } catch (fallbackError) {
        logger.error(`Fallback also failed: ${context}`, "CLIENT", {
          primaryError: error instanceof Error ? error.message : error,
          fallbackError:
            fallbackError instanceof Error
              ? fallbackError.message
              : fallbackError,
        });

        throw handleError.async(
          fallbackError,
          `fallback operation: ${context}`,
        );
      }
    }
  },
};

/**
 * Error boundary helpers
 */
export const errorBoundaryHelpers = {
  logError: (error: Error, errorInfo: ErrorInfo, componentName?: string) => {
    const clientError = handleError.component(error, componentName, errorInfo);

    // Send to error reporting service if available
    if (typeof window !== "undefined" && window.navigator.sendBeacon) {
      try {
        const errorData = JSON.stringify({
          ...clientError.toJSON(),
          url: window.location.href,
          userAgent: window.navigator.userAgent,
          timestamp: new Date().toISOString(),
        });

        window.navigator.sendBeacon("/api/errors/client", errorData);
      } catch (e) {
        console.error("Failed to send error report:", e);
      }
    }

    return clientError;
  },

  shouldRecover: (error: Error): boolean => {
    // Don't recover from critical errors
    if (
      error.name === "ChunkLoadError" ||
      error.message.includes("Loading chunk")
    ) {
      return false;
    }

    // Don't recover from syntax errors
    if (error instanceof SyntaxError) {
      return false;
    }

    // Don't recover from reference errors in production
    if (
      error instanceof ReferenceError &&
      process.env.NODE_ENV === "production"
    ) {
      return false;
    }

    return true;
  },

  getRecoveryAction: (error: Error): string => {
    if (
      error.name === "ChunkLoadError" ||
      error.message.includes("Loading chunk")
    ) {
      return "reload";
    }

    if (error.message.includes("Network")) {
      return "retry";
    }

    return "fallback";
  },
};

/**
 * API error parser for consistent client-side error handling
 */
export function parseApiError(error: any): ClientApiError {
  // Handle fetch/axios errors
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.error || data?.message || "API request failed";
    const code = data?.code || ClientErrorType.NETWORK;

    return new ClientApiError(
      message,
      code,
      status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      { status, data },
    );
  }

  // Handle network errors
  if (error.request) {
    return new ClientApiError(
      "Network error - please check your connection",
      ClientErrorType.NETWORK,
      ErrorSeverity.HIGH,
      { request: error.request },
    );
  }

  // Handle other errors
  return new ClientApiError(
    error.message || "Unknown error occurred",
    ClientErrorType.UNKNOWN,
    ErrorSeverity.MEDIUM,
    { originalError: error },
  );
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;
    const clientError = handleError.async(error, "unhandled promise rejection");

    // Prevent default browser behavior
    event.preventDefault();

    console.error("Unhandled promise rejection:", clientError);
  });

  // Handle global errors
  window.addEventListener("error", (event) => {
    const { error, filename, lineno, colno } = event;
    const clientError = new ClientApiError(
      error?.message || "Global error occurred",
      ClientErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      {
        filename,
        lineno,
        colno,
        originalError: error,
      },
    );

    logger.error("Global Error", "CLIENT", clientError.toJSON());
  });
}

/**
 * Hook-friendly error state management
 */
export interface ErrorState {
  error: ClientApiError | null;
  isError: boolean;
  severity: ErrorSeverity;
  canRetry: boolean;
  retryCount: number;
}

export function createErrorState(error?: ClientApiError | null): ErrorState {
  return {
    error: error || null,
    isError: !!error,
    severity: error?.severity || ErrorSeverity.LOW,
    canRetry:
      error?.code === ClientErrorType.NETWORK ||
      error?.code === ClientErrorType.TIMEOUT,
    retryCount: 0,
  };
}

/**
 * Error message formatter for user-friendly display
 */
export function formatErrorMessage(
  error: ClientApiError | Error | string,
): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof ClientApiError) {
    switch (error.code) {
      case ClientErrorType.NETWORK:
        return "Connection error. Please check your internet connection and try again.";
      case ClientErrorType.AUTHENTICATION:
        return "Please sign in to continue.";
      case ClientErrorType.AUTHORIZATION:
        return "You don't have permission to perform this action.";
      case ClientErrorType.VALIDATION:
        return error.message; // Validation messages are usually user-friendly
      case ClientErrorType.TIMEOUT:
        return "Request timed out. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return error.message || "An unexpected error occurred.";
}
