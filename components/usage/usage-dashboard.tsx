"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  HardDrive,
  Activity,
  Users,
  Database,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Clock,
  Zap,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================

interface UsageMetrics {
  totalStorageUsed: number;
  storageLimit: number;
  storagePercentage: number;
  apiCallsToday: number;
  apiCallsThisMonth: number;
  apiCallLimit: number;
  activeUsers: number;
  totalUsers: number;
  userLimit: number;
  totalRecords: number;
  recordsLimit: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

interface UsageAlert {
  type: "storage" | "api_calls" | "users" | "records" | "performance";
  severity: "info" | "warning" | "critical";
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: Date;
}

interface OrganizationUsage {
  organizationId: string;
  metrics: UsageMetrics;
  lastUpdated: Date;
  alerts: UsageAlert[];
}

interface UsageHistory {
  date: Date;
  metrics: Partial<UsageMetrics>;
}

interface UsageDashboardProps {
  organizationId?: string;
}

// ============================================================================
// USAGE DASHBOARD COMPONENT
// ============================================================================

export function UsageDashboard({ organizationId }: UsageDashboardProps) {
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchUsageData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (organizationId) {
        params.set("organizationId", organizationId);
      }
      params.set("days", "30");

      const response = await fetch(`/api/usage?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch usage data");
      }

      const data = await response.json();
      setUsage(data.current);
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching usage data:", error);
      toast.error("Failed to fetch usage data");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const updateUsageData = async () => {
    try {
      setUpdating(true);
      const response = await fetch("/api/usage/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update usage data");
      }

      const data = await response.json();
      setUsage(data.usage);
      toast.success("Usage data updated successfully");
    } catch (error) {
      console.error("Error updating usage data:", error);
      toast.error("Failed to update usage data");
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  // const getProgressColor = (percentage: number) => {
  //   if (percentage >= 90) return "bg-red-500";
  //   if (percentage >= 75) return "bg-yellow-500";
  //   return "bg-green-500";
  // };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading usage data...</span>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No usage data available</p>
        <Button onClick={fetchUsageData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your organization's resource usage and limits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsageData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={updateUsageData} disabled={updating}>
            <TrendingUp
              className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`}
            />
            Update Now
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {usage.alerts.length > 0 && (
        <div className="space-y-2">
          {usage.alerts.map((alert, index) => (
            <Alert key={index} className={getAlertColor(alert.severity)}>
              {getAlertIcon(alert.severity)}
              <AlertTitle className="capitalize">
                {alert.severity} Alert
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Main Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Storage Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Storage Usage
                </CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.metrics.storagePercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(usage.metrics.totalStorageUsed)} of{" "}
                  {formatBytes(usage.metrics.storageLimit)}
                </p>
                <Progress
                  value={usage.metrics.storagePercentage}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* API Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  API Calls (Month)
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    (usage.metrics.apiCallsThisMonth /
                      usage.metrics.apiCallLimit) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage.metrics.apiCallsThisMonth.toLocaleString()} of{" "}
                  {usage.metrics.apiCallLimit.toLocaleString()}
                </p>
                <Progress
                  value={
                    (usage.metrics.apiCallsThisMonth /
                      usage.metrics.apiCallLimit) *
                    100
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.metrics.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage.metrics.activeUsers} active of{" "}
                  {usage.metrics.userLimit} limit
                </p>
                <Progress
                  value={
                    (usage.metrics.activeUsers / usage.metrics.userLimit) * 100
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Database Records */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Database Records
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    (usage.metrics.totalRecords / usage.metrics.recordsLimit) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage.metrics.totalRecords.toLocaleString()} of{" "}
                  {usage.metrics.recordsLimit.toLocaleString()}
                </p>
                <Progress
                  value={
                    (usage.metrics.totalRecords / usage.metrics.recordsLimit) *
                    100
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.metrics.avgResponseTime}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage.metrics.avgResponseTime < 1000
                    ? "Excellent"
                    : usage.metrics.avgResponseTime < 2000
                      ? "Good"
                      : "Needs attention"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Error Rate
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.metrics.errorRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage.metrics.errorRate < 1
                    ? "Excellent"
                    : usage.metrics.errorRate < 5
                      ? "Good"
                      : "Needs attention"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usage.metrics.uptime.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {usage.metrics.uptime > 99.9
                    ? "Excellent"
                    : usage.metrics.uptime > 99
                      ? "Good"
                      : "Needs attention"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Storage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Breakdown</CardTitle>
                <CardDescription>
                  Detailed storage usage information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Used</span>
                  <span className="text-sm">
                    {formatBytes(usage.metrics.totalStorageUsed)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Available</span>
                  <span className="text-sm">
                    {formatBytes(
                      usage.metrics.storageLimit -
                        usage.metrics.totalStorageUsed,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Limit</span>
                  <span className="text-sm">
                    {formatBytes(usage.metrics.storageLimit)}
                  </span>
                </div>
                <Progress
                  value={usage.metrics.storagePercentage}
                  className="mt-4"
                />
                <p className="text-xs text-muted-foreground">
                  {usage.metrics.storagePercentage.toFixed(1)}% of storage limit
                  used
                </p>
              </CardContent>
            </Card>

            {/* API Usage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>API Usage Breakdown</CardTitle>
                <CardDescription>Monthly API call statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Today</span>
                  <span className="text-sm">
                    {usage.metrics.apiCallsToday.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">This Month</span>
                  <span className="text-sm">
                    {usage.metrics.apiCallsThisMonth.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly Limit</span>
                  <span className="text-sm">
                    {usage.metrics.apiCallLimit.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    (usage.metrics.apiCallsThisMonth /
                      usage.metrics.apiCallLimit) *
                    100
                  }
                  className="mt-4"
                />
                <p className="text-xs text-muted-foreground">
                  {(
                    (usage.metrics.apiCallsThisMonth /
                      usage.metrics.apiCallLimit) *
                    100
                  ).toFixed(1)}
                  % of monthly limit used
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Last Updated */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last updated: {format(new Date(usage.lastUpdated), "PPpp")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {history.length > 0 ? (
            <div className="space-y-6">
              {/* Storage Usage Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Storage Usage Trend (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          format(new Date(value), "MMM dd")
                        }
                      />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        labelFormatter={(value) =>
                          format(new Date(value), "PPP")
                        }
                        formatter={(value: any) => [
                          `${value}%`,
                          "Storage Usage",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="metrics.storage_usage"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* API Usage Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    API Usage Trend (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          format(new Date(value), "MMM dd")
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) =>
                          format(new Date(value), "PPP")
                        }
                        formatter={(value: any) => [
                          value?.toLocaleString() || 0,
                          "API Calls",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="metrics.api_calls_monthly"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No historical data available
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Usage trends will appear here after collecting data over time
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UsageDashboard;
