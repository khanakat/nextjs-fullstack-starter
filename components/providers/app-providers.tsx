"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EnhancedErrorBoundary } from "@/components/error-boundary/enhanced-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && "status" in error) {
                const { status } = error as any;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
          },
          mutations: {
            onError: (error) => {
              console.error("Mutation error:", error);
              // You can add global error handling here
            },
          },
        },
      }),
  );

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined, // Will use theme from next-themes
        variables: {
          colorPrimary: "hsl(var(--primary))",
        },
        elements: {
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          card: "bg-card",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <EnhancedErrorBoundary
            componentName="AppProviders"
            showErrorDetails={process.env.NODE_ENV === "development"}
            enableReporting={true}
            maxRetries={2}
          >
            <TooltipProvider delayDuration={300}>
              {children}
              <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
              />
            </TooltipProvider>
          </EnhancedErrorBoundary>
        </NextThemesProvider>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// Error Boundary Provider
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong!</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message || "An unexpected error occurred"}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={resetErrorBoundary}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>

          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full"
          >
            Go home
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium">
              Error details (dev only)
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundaryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("Error caught by boundary:", error, errorInfo);
        // You can send error to logging service here
      }}
      onReset={() => {
        // Clear any cached data, reset state, etc.
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
