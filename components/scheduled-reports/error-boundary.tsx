"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

export class ScheduledReportsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ScheduledReports ErrorBoundary] Error caught:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log to external error reporting service if available
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: "ScheduledReports",
        },
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An error occurred while loading the scheduled reports. This might be a temporary issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  {this.state.error?.message || "An unexpected error occurred"}
                </AlertDescription>
              </Alert>

              {/* Error Details (Development Mode) */}
              {this.props.showDetails && process.env.NODE_ENV === "development" && (
                <div className="space-y-2">
                  <details className="rounded-md border p-3">
                    <summary className="cursor-pointer font-medium text-sm">
                      Technical Details (Development Only)
                    </summary>
                    <div className="mt-2 space-y-2 text-xs">
                      {this.state.error && (
                        <div>
                          <strong>Error:</strong>
                          <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-xs">
                            {this.state.error.toString()}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>If this problem persists, please contact support or try refreshing the page.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("[ScheduledReports] Error:", error, errorInfo);
    
    // Log to external error reporting service if available
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: errorInfo ? {
          react: {
            componentStack: errorInfo.componentStack,
          },
        } : undefined,
        tags: {
          component: "ScheduledReports",
        },
      });
    }
  }, []);

  return { handleError };
}

// Simple error fallback component
export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-destructive">Error Loading Component</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button onClick={resetError} size="sm" variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

// Loading fallback component
export function LoadingFallback({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

// Network error component
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Connection Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Unable to connect to the server. Please check your internet connection.</span>
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}