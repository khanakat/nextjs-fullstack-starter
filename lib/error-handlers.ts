/**
 * Centralized error handling utilities for consistent error management
 * across the entire application
 */

import React from "react";
import { toast } from "sonner";
import { logger } from "./logger";
import {
  ClientApiError,
  ErrorSeverity,
  ClientErrorType,
  parseApiError,
} from "./error-utils";
import { ZodError } from "zod";
import { StandardErrorResponse } from "./standardized-error-responses";

/**
 * Standard error handler for API calls
 */
export class ApiErrorHandler {
  static async handleApiError(
    error: any,
    context: string = "API Request",
    showToast: boolean = true,
  ): Promise<ClientApiError> {
    const clientError = parseApiError(error);

    // Log the error
    logger.apiError(`${context} failed`, error, { context });

    // Show user-friendly toast notification
    if (showToast) {
      const message = this.getUserFriendlyMessage(clientError);

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

    return clientError;
  }

  private static getUserFriendlyMessage(error: ClientApiError): string {
    // Map technical errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      [ClientErrorType.NETWORK]:
        "Problema de conexión. Por favor, verifica tu internet.",
      [ClientErrorType.AUTHENTICATION]:
        "Sesión expirada. Por favor, inicia sesión nuevamente.",
      [ClientErrorType.AUTHORIZATION]:
        "No tienes permisos para realizar esta acción.",
      [ClientErrorType.VALIDATION]: "Los datos ingresados no son válidos.",
      [ClientErrorType.TIMEOUT]:
        "La operación tardó demasiado. Intenta nuevamente.",
      [ClientErrorType.UNKNOWN]:
        "Ocurrió un error inesperado. Intenta nuevamente.",
    };

    return errorMessages[error.code] || error.message;
  }
}

/**
 * Standard error handler for form operations
 */
export class FormErrorHandler {
  static handleFormError(
    error: any,
    fieldName?: string,
    showToast: boolean = true,
  ): { message: string; field?: string } {
    const clientError = parseApiError(error);

    logger.error("Form validation error", "FORM", {
      field: fieldName,
      error: clientError.toJSON(),
    });

    if (showToast) {
      toast.error(
        `Error en ${fieldName || "el formulario"}: ${clientError.message}`,
      );
    }

    return {
      message: clientError.message,
      field: fieldName,
    };
  }

  static handleValidationErrors(
    errors: Array<{ field: string; message: string }>,
    showToast: boolean = true,
  ): Record<string, string> {
    const errorMap: Record<string, string> = {};

    errors.forEach(({ field, message }) => {
      errorMap[field] = message;
    });

    logger.warn("Multiple validation errors", "FORM", { errors });

    if (showToast) {
      toast.error(`Se encontraron ${errors.length} errores en el formulario`);
    }

    return errorMap;
  }
}

/**
 * Standard error handler for async operations
 */
export class AsyncErrorHandler {
  static async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context: string = "Async Operation",
    options: {
      showToast?: boolean;
      retries?: number;
      retryDelay?: number;
      onError?: (error: ClientApiError) => void;
      onRetry?: (attempt: number) => void;
    } = {},
  ): Promise<{ data: T | null; error: ClientApiError | null }> {
    const {
      showToast = true,
      retries = 0,
      retryDelay = 1000,
      onError,
      onRetry,
    } = options;

    let lastError: ClientApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await operation();
        return { data, error: null };
      } catch (error) {
        lastError = await ApiErrorHandler.handleApiError(
          error,
          `${context} (attempt ${attempt + 1})`,
          showToast && attempt === retries, // Only show toast on final attempt
        );

        onError?.(lastError);

        if (attempt < retries) {
          onRetry?.(attempt + 1);
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt)),
          );
        }
      }
    }

    return { data: null, error: lastError };
  }
}

/**
 * Standard error handler for component errors
 */
export class ComponentErrorHandler {
  static handleComponentError(
    error: Error,
    componentName: string,
    errorInfo?: any,
    showToast: boolean = true,
  ): ClientApiError {
    const clientError = new ClientApiError(
      `Error en componente ${componentName}: ${error.message}`,
      ClientErrorType.COMPONENT,
      ErrorSeverity.HIGH,
      {
        componentName,
        componentStack: errorInfo?.componentStack,
        stack: error.stack,
      },
    );

    logger.componentError(
      "Component error occurred",
      error,
      componentName,
      errorInfo,
    );

    if (showToast) {
      toast.error(
        "Ocurrió un error en la interfaz. La página se recargará automáticamente.",
      );
    }

    return clientError;
  }
}

/**
 * Utility functions for common error handling patterns
 */
export const errorHandlers = {
  /**
   * Handle fetch API errors with consistent error handling
   */
  async fetch(
    url: string,
    options?: RequestInit,
    context?: string,
  ): Promise<{ data: any | null; error: ClientApiError | null }> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      const clientError = await ApiErrorHandler.handleApiError(
        error,
        context || `Fetch ${url}`,
      );
      return { data: null, error: clientError };
    }
  },

  /**
   * Handle localStorage operations with error handling
   */
  localStorage: {
    get(key: string, defaultValue: any = null): any {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        logger.error("LocalStorage get error", "CLIENT", { key, error });
        return defaultValue;
      }
    },

    set(key: string, value: any): boolean {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        logger.error("LocalStorage set error", "CLIENT", { key, error });
        return false;
      }
    },

    remove(key: string): boolean {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        logger.error("LocalStorage remove error", "CLIENT", { key, error });
        return false;
      }
    },
  },

  /**
   * Handle promise rejections with consistent error handling
   */
  async promise<T>(
    promise: Promise<T>,
    context: string = "Promise",
  ): Promise<{ data: T | null; error: ClientApiError | null }> {
    try {
      const data = await promise;
      return { data, error: null };
    } catch (error) {
      const clientError = await ApiErrorHandler.handleApiError(error, context);
      return { data: null, error: clientError };
    }
  },
};

/**
 * Error boundary helpers for React components
 */
export const errorBoundaryUtils = {
  /**
   * Create error boundary props with consistent error handling
   */
  createErrorBoundaryProps(componentName: string) {
    return {
      onError: (error: Error, errorInfo: any) => {
        ComponentErrorHandler.handleComponentError(
          error,
          componentName,
          errorInfo,
        );
      },
      fallback: ({ resetError }: { error: Error; resetError: () => void }) => {
        return React.createElement(
          "div",
          {
            className:
              "flex flex-col items-center justify-center p-8 text-center",
          },
          [
            React.createElement(
              "h2",
              {
                key: "title",
                className: "text-lg font-semibold text-destructive mb-2",
              },
              "Algo salió mal",
            ),
            React.createElement(
              "p",
              {
                key: "message",
                className: "text-muted-foreground mb-4",
              },
              "Ocurrió un error inesperado en esta sección.",
            ),
            React.createElement(
              "button",
              {
                key: "button",
                onClick: resetError,
                className:
                  "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90",
              },
              "Intentar nuevamente",
            ),
          ],
        );
      },
    };
  },
};

/**
 * Handle Zod validation errors with standardized response
 */
export function handleZodError(zodError: ZodError, requestId?: string) {
  return StandardErrorResponse.validation(zodError, requestId);
}
