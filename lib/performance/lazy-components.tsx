import { lazy, Suspense, ComponentType, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Loading fallback components
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-4" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const ReportsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-28" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-40" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export const WorkflowsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const ModalSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-48" />
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="flex justify-end gap-2 pt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export const LoadingSpinner = ({
  size = "default",
}: {
  size?: "sm" | "default" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
    </div>
  );
};

// Lazy loaded components with proper error boundaries
export const LazyAnalyticsDashboard = lazy(() =>
  import("@/components/analytics/analytics-dashboard").then((module) => ({
    default: module.AnalyticsDashboard,
  })),
);

export const LazyReportsDashboard = lazy(() =>
  import("@/components/reports/reports-dashboard").then((module) => ({
    default: module.ReportsDashboard,
  })),
);

export const LazyReportBuilder = lazy(() =>
  import("@/components/reports/report-builder").then((module) => ({
    default: module.ReportBuilder,
  })),
);

export const LazyReportViewer = lazy(() =>
  import("@/components/reports/report-viewer").then((module) => ({
    default: module.ReportViewer,
  })),
);

// export const LazyWorkflowsDashboard = lazy(() =>
//   import("@/components/workflows/workflows-dashboard").then((module) => ({
//     default: module.WorkflowsDashboard,
//   })),
// );

export const LazyTaskDashboard = lazy(() =>
  import("@/components/workflows/task-dashboard").then((module) => ({
    default: module.TaskDashboard,
  })),
);

export const LazyAuditEventModal = lazy(() =>
  import("@/components/audit/audit-event-modal").then((module) => ({
    default: module.AuditEventModal,
  })),
);

export const LazyScheduledReportsList = lazy(() =>
  import("@/components/scheduled-reports/scheduled-reports-list").then(
    (module) => ({
      default: module.ScheduledReportsList,
    }),
  ),
);

export const LazyUsageDashboard = lazy(() =>
  import("@/components/usage/usage-dashboard").then((module) => ({
    default: module.UsageDashboard,
  })),
);

// export const LazyCollaborationPanel = lazy(() =>
//   import("@/components/collaboration/collaboration-panel").then((module) => ({
//     default: module.CollaborationPanel,
//   })),
// );

// Higher-order component for lazy loading with suspense
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback: ReactNode = <LoadingSpinner />,
) {
  return function LazyComponent(props: T) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Preload functions for critical components
export const preloadCriticalComponents = () => {
  // Preload dashboard components that are likely to be used
  import("@/components/analytics/analytics-dashboard");
  import("@/components/reports/reports-dashboard");
  // import("@/components/workflows/workflows-dashboard"); // Commented out as not available
};

// Component registry for dynamic loading
export const lazyComponentRegistry = {
  "analytics-dashboard": {
    component: LazyAnalyticsDashboard,
    fallback: <AnalyticsSkeleton />,
    preload: () => import("@/components/analytics/analytics-dashboard"),
  },
  "reports-dashboard": {
    component: LazyReportsDashboard,
    fallback: <ReportsSkeleton />,
    preload: () => import("@/components/reports/reports-dashboard"),
  },
  "report-builder": {
    component: LazyReportBuilder,
    fallback: <ReportsSkeleton />,
    preload: () => import("@/components/reports/report-builder"),
  },
  "report-viewer": {
    component: LazyReportViewer,
    fallback: <ReportsSkeleton />,
    preload: () => import("@/components/reports/report-viewer"),
  },
  // "workflows-dashboard": {
  //   component: LazyWorkflowsDashboard,
  //   fallback: <WorkflowsSkeleton />,
  //   preload: () => import("@/components/workflows/workflows-dashboard"),
  // },
  "task-dashboard": {
    component: LazyTaskDashboard,
    fallback: <WorkflowsSkeleton />,
    preload: () => import("@/components/workflows/task-dashboard"),
  },
  "audit-event-modal": {
    component: LazyAuditEventModal,
    fallback: <ModalSkeleton />,
    preload: () => import("@/components/audit/audit-event-modal"),
  },
  "scheduled-reports-list": {
    component: LazyScheduledReportsList,
    fallback: <ReportsSkeleton />,
    preload: () =>
      import("@/components/scheduled-reports/scheduled-reports-list"),
  },
  "usage-dashboard": {
    component: LazyUsageDashboard,
    fallback: <DashboardSkeleton />,
    preload: () => import("@/components/usage/usage-dashboard"),
  },
  // "collaboration-panel": {
  //   component: LazyCollaborationPanel,
  //   fallback: <LoadingSpinner />,
  //   preload: () => import("@/components/collaboration/collaboration-panel"),
  // },
} as const;

export type LazyComponentKey = keyof typeof lazyComponentRegistry;

// Hook for dynamic component loading
export function useLazyComponent(key: LazyComponentKey) {
  const config = lazyComponentRegistry[key];

  return {
    Component: config.component,
    fallback: config.fallback,
    preload: config.preload,
  };
}
