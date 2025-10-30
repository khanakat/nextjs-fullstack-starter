"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Activity,
  XCircle
} from "lucide-react";
import { fetchScheduledReportsWithRetry } from "@/lib/utils/api-retry";

interface ScheduledReportsStatsProps {
  organizationId: string;
  refreshTrigger: number;
}

interface StatsData {
  totalReports: number;
  activeReports: number;
  successfulExecutions: number;
  failedExecutions: number;
  nextExecution: string | null;
  totalRecipients: number;
  executionsToday: number;
  averageExecutionTime: number;
}

export function ScheduledReportsStats({ organizationId, refreshTrigger }: ScheduledReportsStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalReports: 0,
    activeReports: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    nextExecution: null,
    totalRecipients: 0,
    executionsToday: 0,
    averageExecutionTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchScheduledReportsWithRetry(`/api/scheduled-reports/stats?organizationId=${organizationId}`);
        
        if (!result.ok) {
          throw new Error(result.error || 'Failed to fetch stats');
        }

        setStats(result.data);
      } catch (err) {
        console.error("Error fetching scheduled reports stats:", err);
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [organizationId, refreshTrigger]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = stats.successfulExecutions + stats.failedExecutions > 0 
    ? Math.round((stats.successfulExecutions / (stats.successfulExecutions + stats.failedExecutions)) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReports}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeReports} active
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.successfulExecutions} successful, {stats.failedExecutions} failed
          </p>
        </CardContent>
      </Card>

      {/* Today's Executions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Executions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.executionsToday}</div>
          <p className="text-xs text-muted-foreground">
            Avg: {stats.averageExecutionTime}ms
          </p>
        </CardContent>
      </Card>

      {/* Next Execution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Execution</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.nextExecution ? (
              <span className="text-sm">
                {new Date(stats.nextExecution).toLocaleString()}
              </span>
            ) : (
              "None"
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalRecipients} total recipients
          </p>
        </CardContent>
      </Card>
    </div>
  );
}