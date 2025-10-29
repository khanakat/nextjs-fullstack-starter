import { useState, useCallback, useRef } from "react";
import {
  ClientApiError,
  ErrorSeverity,
  ClientErrorType,
  errorRecovery,
  parseApiError,
  formatErrorMessage,
  createErrorState,
  ErrorState,
} from "@/lib/error-utils";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

/**
 * Enhanced error handling hook for React components
 */
export interface UseErrorHandlerOptions {
  showToast?: boolean;
  logErrors?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: ClientApiError) => void;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: (error: ClientApiError) => void;
}

export interface UseErrorHandlerReturn {
  error: ClientApiError | null;
  errorState: ErrorState;
  isError: boolean;
  severity: ErrorSeverity;
  canRetry: boolean;
  retryCount: number;
  handleError: (error: any, context?: string) => ClientApiError;
  clearError: () => void;
  retry: () => Promise<void>;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: string,
  ) => Promise<T | null>;
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    context?: string,
  ) => Promise<T | null>;
  executeWithFallback: <T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context?: string,
  ) => Promise<T | null>;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {},
): UseErrorHandlerReturn {
  const {
    showToast = true,
    logErrors = true,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>(createErrorState());
  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);
  const retryCountRef = useRef(0);

  const handleErrorInternal = useCallback(
    (error: any, context?: string): ClientApiError => {
      let clientError: ClientApiError;

      // Parse different types of errors
      if (error instanceof ClientApiError) {
        clientError = error;
      } else if (error?.response || error?.request) {
        // API/Network errors
        clientError = parseApiError(error);
      } else if (error instanceof Error) {
        // Generic JavaScript errors
        clientError = new ClientApiError(
          error.message,
          ClientErrorType.UNKNOWN,
          ErrorSeverity.MEDIUM,
          { context, originalError: error },
        );
      } else {
        // Unknown error types
        clientError = new ClientApiError(
          typeof error === "string" ? error : "Unknown error occurred",
          ClientErrorType.UNKNOWN,
          ErrorSeverity.MEDIUM,
          { context, originalError: error },
        );
      }

      // Update error state
      const newErrorState = createErrorState(clientError);
      newErrorState.retryCount = retryCountRef.current;
      setErrorState(newErrorState);

      // Log error if enabled
      if (logErrors) {
        const logLevel =
          clientError.severity === ErrorSeverity.HIGH ||
          clientError.severity === ErrorSeverity.CRITICAL
            ? "error"
            : "warn";
        logger[logLevel]("Component Error", "CLIENT", {
          ...clientError.toJSON(),
          context,
          retryCount: retryCountRef.current,
        });
      }

      // Show toast notification if enabled
      if (showToast) {
        const message = formatErrorMessage(clientError);

        switch (clientError.severity) {
          case ErrorSeverity.CRITICAL:
          case ErrorSeverity.HIGH:
            toast.error(message);
            break;
          case ErrorSeverity.MEDIUM:
            toast.warning(message);
            break;
          case ErrorSeverity.LOW:
            toast.info(message);
            break;
        }
      }

      // Call custom error handler
      onError?.(clientError);

      return clientError;
    },
    [logErrors, showToast, onError],
  );

  const clearError = useCallback(() => {
    setErrorState(createErrorState());
    retryCountRef.current = 0;
    lastOperationRef.current = null;
  }, []);

  const retry = useCallback(async () => {
    if (!lastOperationRef.current || !errorState.canRetry) {
      return;
    }

    if (retryCountRef.current >= maxRetries) {
      onMaxRetriesReached?.(errorState.error!);
      return;
    }

    retryCountRef.current += 1;
    onRetry?.(retryCountRef.current);

    try {
      clearError();
      await lastOperationRef.current();
    } catch (error) {
      handleErrorInternal(error, "retry operation");
    }
  }, [
    errorState.canRetry,
    errorState.error,
    maxRetries,
    onMaxRetriesReached,
    onRetry,
    clearError,
    handleErrorInternal,
  ]);

  const executeWithErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: string,
    ): Promise<T | null> => {
      try {
        clearError();
        lastOperationRef.current = operation;
        const result = await operation();
        return result;
      } catch (error) {
        handleErrorInternal(error, context);
        return null;
      }
    },
    [clearError, handleErrorInternal],
  );

  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: string,
    ): Promise<T | null> => {
      try {
        clearError();
        lastOperationRef.current = operation;

        const result = await errorRecovery.retry(
          operation,
          maxRetries,
          retryDelay,
          true,
        );

        return result;
      } catch (error) {
        retryCountRef.current = maxRetries;
        handleErrorInternal(error, context);
        onMaxRetriesReached?.(
          error instanceof ClientApiError
            ? error
            : handleErrorInternal(error, context),
        );
        return null;
      }
    },
    [
      clearError,
      maxRetries,
      retryDelay,
      handleErrorInternal,
      onMaxRetriesReached,
    ],
  );

  const executeWithFallback = useCallback(
    async <T>(
      primary: () => Promise<T>,
      fallback: () => Promise<T>,
      context?: string,
    ): Promise<T | null> => {
      try {
        clearError();
        lastOperationRef.current = primary;

        const result = await errorRecovery.fallback(primary, fallback, context);

        return result;
      } catch (error) {
        handleErrorInternal(error, context);
        return null;
      }
    },
    [clearError, handleErrorInternal],
  );

  return {
    error: errorState.error,
    errorState,
    isError: errorState.isError,
    severity: errorState.severity,
    canRetry: errorState.canRetry,
    retryCount: retryCountRef.current,
    handleError: handleErrorInternal,
    clearError,
    retry,
    executeWithErrorHandling,
    executeWithRetry,
    executeWithFallback,
  };
}

/**
 * Simplified error handler hook for basic use cases
 */
export function useSimpleErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: any) => {
    const message = formatErrorMessage(error);
    setError(message);
    toast.error(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeAsync = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await operation();
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  return {
    error,
    isError: !!error,
    isLoading,
    handleError,
    clearError,
    executeAsync,
  };
}

/**
 * Hook for handling form validation errors
 */
export interface UseFormErrorHandlerReturn {
  errors: Record<string, string>;
  hasErrors: boolean;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  handleValidationError: (error: any) => void;
}

export function useFormErrorHandler(): UseFormErrorHandlerReturn {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleValidationError = useCallback((error: any) => {
    if (
      error?.response?.data?.details &&
      Array.isArray(error.response.data.details)
    ) {
      // Handle Zod validation errors
      const fieldErrors: Record<string, string> = {};
      error.response.data.details.forEach((detail: any) => {
        if (detail.field && detail.message) {
          fieldErrors[detail.field] = detail.message;
        }
      });
      setErrors(fieldErrors);
    } else if (error?.details && Array.isArray(error.details)) {
      // Handle direct validation errors
      const fieldErrors: Record<string, string> = {};
      error.details.forEach((detail: any) => {
        if (detail.field && detail.message) {
          fieldErrors[detail.field] = detail.message;
        }
      });
      setErrors(fieldErrors);
    } else {
      // Handle generic validation error
      const message = formatErrorMessage(error);
      toast.error(message);
    }
  }, []);

  return {
    errors,
    hasErrors: Object.keys(errors).length > 0,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleValidationError,
  };
}
