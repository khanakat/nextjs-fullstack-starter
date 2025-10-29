import React from "react";
import { cn } from "@/lib/utils";

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}

      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
      )}

      {action && action}
    </div>
  );
}

// Loading State Component
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4",
        className,
      )}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Error State Component
interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      <div className="mb-4 text-destructive">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{message}</p>

      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// Data State Wrapper - Combines all states
interface DataStateWrapperProps<T> {
  isLoading: boolean;
  isError: boolean;
  error?: string | null;
  data?: T | null;
  isEmpty?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  loadingMessage?: string;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
  className?: string;
}

export function DataStateWrapper<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty = false,
  emptyState,
  loadingMessage,
  onRetry,
  children,
  className,
}: DataStateWrapperProps<T>) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} className={className} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error || "Failed to load data"}
        retry={onRetry}
        className={className}
      />
    );
  }

  if (isEmpty || !data) {
    if (emptyState) {
      return (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          action={emptyState.action}
          className={className}
        />
      );
    }
    return null;
  }

  return <>{children(data)}</>;
}

// Conditional Render Component
interface ConditionalRenderProps {
  condition: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ConditionalRender({
  condition,
  fallback = null,
  children,
}: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

// Fade In Animation Component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  className,
}: FadeInProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "transition-opacity",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Skeleton Loader Component
interface SkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export function Skeleton({
  className,
  lines = 1,
  avatar = false,
}: SkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {avatar && <div className="rounded-full bg-muted h-10 w-10 mb-4" />}

      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 bg-muted rounded",
            index < lines - 1 && "mb-2",
            index === lines - 1 && lines > 1 && "w-3/4", // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

// Progress Indicator Component
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel = false,
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && (
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

// Badge Component with variants
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        // Variants
        variant === "default" && "bg-primary/10 text-primary",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "success" &&
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        variant === "warning" &&
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        variant === "error" &&
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        // Sizes
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-0.5 text-sm",
        size === "lg" && "px-3 py-1 text-base",
        className,
      )}
    >
      {children}
    </span>
  );
}
