"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import {
  ClientApiError,
  ClientErrorType,
  ErrorSeverity,
  errorBoundaryHelpers,
} from "@/lib/error-utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { toast } from "sonner";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    retry: () => void,
  ) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showErrorDetails?: boolean;
  enableReporting?: boolean;
  componentName?: string;
}

export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName, maxRetries = 3 } = this.props;

    // Create structured error
    const clientError = new ClientApiError(
      error.message,
      ClientErrorType.COMPONENT,
      this.getErrorSeverity(error),
      {
        componentName: componentName || "Unknown",
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        retryCount: this.state.retryCount,
        errorId: this.state.errorId,
      },
    );

    // Log error using structured logger
    errorBoundaryHelpers.logError(error, errorInfo, componentName);

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Show toast notification for critical errors
    if (clientError.severity === ErrorSeverity.CRITICAL) {
      toast.error("A critical error occurred. Please refresh the page.");
    }

    // Auto-retry for recoverable errors
    if (
      this.state.retryCount < maxRetries &&
      errorBoundaryHelpers.shouldRecover(error)
    ) {
      this.scheduleRetry();
    }
  }

  private getErrorSeverity(error: Error): ErrorSeverity {
    // Determine severity based on error type and message
    if (
      error.name === "ChunkLoadError" ||
      error.message.includes("Loading chunk")
    ) {
      return ErrorSeverity.MEDIUM;
    }

    if (
      error.message.includes("Network Error") ||
      error.message.includes("fetch")
    ) {
      return ErrorSeverity.HIGH;
    }

    if (error.stack?.includes("React") || error.message.includes("React")) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.HIGH;
  }

  private scheduleRetry = () => {
    this.retryTimeoutId = setTimeout(
      () => {
        this.handleRetry();
      },
      Math.pow(2, this.state.retryCount) * 1000,
    ); // Exponential backoff
  };

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));

    toast.info(`Retrying... (Attempt ${this.state.retryCount + 1})`);
  };

  private handleManualRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    this.handleRetry();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error || !errorInfo) return;

    // Here you could integrate with error reporting services
    // like Sentry, Bugsnag, etc.
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    console.log("Error Report:", errorReport);
    toast.success("Error report sent. Thank you for helping us improve!");
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      maxRetries = 3,
      showErrorDetails = false,
      enableReporting = true,
      componentName,
    } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.handleManualRetry);
      }

      // Default error UI
      const canRetry = this.state.retryCount < maxRetries;
      const recoveryAction = errorBoundaryHelpers.getRecoveryAction(error);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                {componentName
                  ? `An error occurred in the ${componentName} component.`
                  : "An unexpected error occurred."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error message */}
              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error.message || "An unknown error occurred"}
                </p>
              </div>

              {/* Recovery suggestion */}
              {recoveryAction && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-900/10 p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Suggestion:</strong> {recoveryAction}
                  </p>
                </div>
              )}

              {/* Error details (development only) */}
              {showErrorDetails && process.env.NODE_ENV === "development" && (
                <details className="rounded-md bg-gray-50 dark:bg-gray-900/50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Stack Trace:
                      </p>
                      <pre className="mt-1 text-xs text-gray-800 dark:text-gray-200 overflow-auto">
                        {error.stack}
                      </pre>
                    </div>
                    {errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Component Stack:
                        </p>
                        <pre className="mt-1 text-xs text-gray-800 dark:text-gray-200 overflow-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 sm:flex-row">
                {canRetry && (
                  <Button
                    onClick={this.handleManualRetry}
                    className="flex-1"
                    variant="default"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again ({maxRetries - this.state.retryCount} left)
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Report error button */}
              {enableReporting && (
                <Button
                  onClick={this.handleReportError}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Report this error
                </Button>
              )}

              {/* Retry count indicator */}
              {this.state.retryCount > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Retry attempts: {this.state.retryCount}/{maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<EnhancedErrorBoundaryProps, "children">,
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for error boundary context (if needed)
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}
