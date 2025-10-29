"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Database,
  Timer,
} from "lucide-react";

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  threshold: number;
  trend: "up" | "down" | "stable";
}

interface IntegrationHealth {
  id: string;
  name: string;
  provider: string;
  status: "healthy" | "degraded" | "down" | "maintenance";
  uptime: number;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  throughput: number;
  metrics: HealthMetric[];
  issues: HealthIssue[];
}

interface HealthIssue {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  affectedIntegrations: string[];
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "down";
  integrations: IntegrationHealth[];
  issues: HealthIssue[];
  metrics: {
    totalIntegrations: number;
    healthyIntegrations: number;
    degradedIntegrations: number;
    downIntegrations: number;
    averageUptime: number;
    averageResponseTime: number;
    totalThroughput: number;
  };
}

interface IntegrationHealthMonitorProps {
  className?: string;
}

const IntegrationHealthMonitor: React.FC<IntegrationHealthMonitorProps> = ({
  className = "",
}) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadHealthData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadHealthData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/health");
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error("Failed to load health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunHealthCheck = async (integrationId?: string) => {
    try {
      const url = integrationId
        ? `/api/integrations/${integrationId}/health-check`
        : "/api/integrations/health-check";

      const response = await fetch(url, { method: "POST" });
      if (response.ok) {
        loadHealthData();
      }
    } catch (error) {
      console.error("Failed to run health check:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "maintenance":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      healthy: "default",
      degraded: "secondary",
      down: "destructive",
      maintenance: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      low: "outline",
      medium: "secondary",
      high: "secondary",
      critical: "destructive",
    };

    return (
      <Badge variant={variants[severity] || "outline"} className="capitalize">
        {severity}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case "down":
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (time: number) => {
    return `${time}ms`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!systemHealth) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading health data...
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* System Overview */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                System Health Overview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
                  />
                  Auto Refresh: {autoRefresh ? "On" : "Off"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunHealthCheck()}
                  disabled={loading}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Run Health Check
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.overall)}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Overall Status
                  </p>
                  <p className="text-lg font-semibold capitalize">
                    {systemHealth.overall}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Integrations
                  </p>
                  <p className="text-lg font-semibold">
                    {systemHealth.metrics.totalIntegrations}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Healthy
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {systemHealth.metrics.healthyIntegrations}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Timer className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Response Time
                  </p>
                  <p className="text-lg font-semibold">
                    {formatResponseTime(
                      systemHealth.metrics.averageResponseTime,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* System-wide metrics */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>System Uptime</span>
                  <span>
                    {formatUptime(systemHealth.metrics.averageUptime)}
                  </span>
                </div>
                <Progress
                  value={systemHealth.metrics.averageUptime}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Healthy Integrations</span>
                  <span>
                    {systemHealth.metrics.healthyIntegrations} /{" "}
                    {systemHealth.metrics.totalIntegrations}
                  </span>
                </div>
                <Progress
                  value={
                    (systemHealth.metrics.healthyIntegrations /
                      systemHealth.metrics.totalIntegrations) *
                    100
                  }
                  className="h-2"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Throughput
                </p>
                <p className="text-lg font-semibold">
                  {systemHealth.metrics.totalThroughput.toLocaleString()}{" "}
                  req/min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="issues">
            Issues ({systemHealth.issues.filter((i) => !i.resolved).length})
          </TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {systemHealth.integrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(integration.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{integration.name}</span>
                        <Badge variant="outline">{integration.provider}</Badge>
                        {getStatusBadge(integration.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last checked: {formatTimestamp(integration.lastCheck)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunHealthCheck(integration.id)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Check Health
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Uptime
                    </p>
                    <p className="text-lg font-semibold">
                      {formatUptime(integration.uptime)}
                    </p>
                    <Progress value={integration.uptime} className="h-1 mt-1" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Response Time
                    </p>
                    <p className="text-lg font-semibold">
                      {formatResponseTime(integration.responseTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Error Rate
                    </p>
                    <p className="text-lg font-semibold">
                      {integration.errorRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Throughput
                    </p>
                    <p className="text-lg font-semibold">
                      {integration.throughput} req/min
                    </p>
                  </div>
                </div>

                {/* Integration-specific metrics */}
                {integration.metrics.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Detailed Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {integration.metrics.map((metric, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{metric.name}</span>
                            {getTrendIcon(metric.trend)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${getMetricStatusColor(metric.status)}`}
                            >
                              {metric.value}
                              {metric.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integration issues */}
                {integration.issues.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Active Issues</h4>
                    <div className="space-y-2">
                      {integration.issues
                        .filter((issue) => !issue.resolved)
                        .map((issue) => (
                          <Alert key={issue.id} className="py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">
                                  {issue.title}
                                </span>
                                <span className="text-muted-foreground ml-2">
                                  {issue.description}
                                </span>
                              </div>
                              {getSeverityBadge(issue.severity)}
                            </AlertDescription>
                          </Alert>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {systemHealth.issues.filter((issue) => !issue.resolved).length ===
          0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Issues</h3>
                <p className="text-muted-foreground">
                  All integrations are running smoothly!
                </p>
              </CardContent>
            </Card>
          ) : (
            systemHealth.issues
              .filter((issue) => !issue.resolved)
              .map((issue) => (
                <Card key={issue.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium">{issue.title}</span>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <p className="text-muted-foreground mb-2">
                          {issue.description}
                        </p>
                        <div className="text-sm text-muted-foreground">
                          <span>
                            Reported: {formatTimestamp(issue.timestamp)}
                          </span>
                          {issue.affectedIntegrations.length > 0 && (
                            <span className="ml-4">
                              Affected: {issue.affectedIntegrations.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatUptime(systemHealth.metrics.averageUptime)}
                </div>
                <Progress
                  value={systemHealth.metrics.averageUptime}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatResponseTime(systemHealth.metrics.averageResponseTime)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all integrations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.totalThroughput.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requests per minute
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {systemHealth.metrics.healthyIntegrations}
                  </div>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {systemHealth.metrics.degradedIntegrations}
                  </div>
                  <p className="text-sm text-muted-foreground">Degraded</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {systemHealth.metrics.downIntegrations}
                  </div>
                  <p className="text-sm text-muted-foreground">Down</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {systemHealth.metrics.totalIntegrations}
                  </div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationHealthMonitor;
