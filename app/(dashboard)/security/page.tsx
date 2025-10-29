"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecurityMetricsCard } from "@/components/security/security-metrics-card";
import { SecurityEventsTable } from "@/components/security/security-events-table";
import { SecurityChart } from "@/components/security/security-chart";
import { ApiKeyManagement } from "@/components/security/api-key-management";
import { RefreshCw, Download } from "lucide-react";
import { SecurityEvent, SecurityMetrics } from "@/lib/types/security";
import { toast } from "sonner";

interface SecurityDashboardData {
  metrics: SecurityMetrics;
  events: SecurityEvent[];
  chartData: {
    timeline: Array<{ date: string; events: number; blocked: number }>;
    eventTypes: Array<{ name: string; value: number }>;
    topIPs: Array<{ ip: string; count: number }>;
  };
}

export default function SecurityDashboard() {
  useAuth();
  const { organization } = useOrganization();
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [refreshing, setRefreshing] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const [metricsResponse, eventsResponse] = await Promise.all([
        fetch(
          `/api/security/metrics?organizationId=${organization.id}&range=${timeRange}`,
        ),
        fetch(
          `/api/security/events?organizationId=${organization.id}&limit=50`,
        ),
      ]);

      if (metricsResponse.ok && eventsResponse.ok) {
        const [metricsData, eventsData] = await Promise.all([
          metricsResponse.json(),
          eventsResponse.json(),
        ]);

        setData({
          metrics: metricsData.metrics,
          events: eventsData.events,
          chartData: metricsData.chartData,
        });
      } else {
        throw new Error("Failed to fetch security data");
      }
    } catch (error) {
      console.error("Error fetching security data:", error);
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [organization?.id, timeRange]);

  useEffect(() => {
    if (organization?.id) {
      fetchSecurityData();
    }
  }, [fetchSecurityData, organization?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSecurityData();
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/security/events`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId, resolved: true }),
      });

      if (response.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                events: prev.events.map((event) =>
                  event.id === eventId ? { ...event, resolved: true } : event,
                ),
              }
            : null,
        );
        toast.success("Event marked as resolved");
      } else {
        toast.error("Failed to resolve event");
      }
    } catch (error) {
      toast.error("Failed to resolve event");
    }
  };

  const handleViewEventDetails = (event: SecurityEvent) => {
    // TODO: Implement event details modal
    console.log("View event details:", event);
  };

  const handleExportData = () => {
    if (!data) return;

    const exportData = {
      metrics: data.metrics,
      events: data.events,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Security report exported");
  };

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              Please select an organization to view security dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              Failed to load security data
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security events and manage API access for{" "}
            {organization.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SecurityMetricsCard
          title="Total Requests"
          value={data.metrics.totalRequests.toLocaleString()}
          icon="activity"
          description="All requests in selected period"
        />
        <SecurityMetricsCard
          title="Blocked Requests"
          value={data.metrics.blockedRequests.toLocaleString()}
          icon="ban"
          severity={
            data.metrics.blockedRequests > 100
              ? "high"
              : data.metrics.blockedRequests > 10
                ? "medium"
                : "low"
          }
          change={data.metrics.blockedRequests > 0 ? 15 : undefined}
          changeType="increase"
        />
        <SecurityMetricsCard
          title="Rate Limit Violations"
          value={data.metrics.rateLimitViolations.toLocaleString()}
          icon="alert"
          severity={
            data.metrics.rateLimitViolations > 50
              ? "high"
              : data.metrics.rateLimitViolations > 5
                ? "medium"
                : "low"
          }
        />
        <SecurityMetricsCard
          title="Brute Force Attempts"
          value={data.metrics.bruteForceAttempts.toLocaleString()}
          icon="shield"
          severity={
            data.metrics.bruteForceAttempts > 10
              ? "critical"
              : data.metrics.bruteForceAttempts > 0
                ? "high"
                : "low"
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecurityChart
          title="Security Events Timeline"
          data={data.chartData.timeline}
          type="line"
          dataKey="events"
          xAxisKey="date"
          height={300}
        />
        <SecurityChart
          title="Event Types Distribution"
          data={data.chartData.eventTypes}
          type="pie"
          dataKey="value"
          height={300}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Security Events
                <Badge variant="outline">
                  {data.events.filter((e) => !e.resolved).length} unresolved
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecurityEventsTable
                events={data.events}
                onResolveEvent={handleResolveEvent}
                onViewDetails={handleViewEventDetails}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <ApiKeyManagement organizationId={organization.id} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Blocked IP Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.chartData.topIPs.slice(0, 5).map((item, index) => (
                    <div
                      key={item.ip}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <code className="text-sm font-mono">{item.ip}</code>
                      </div>
                      <Badge variant="secondary">{item.count} events</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Targeted Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.metrics.topTargetedEndpoints
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        key={item.endpoint}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <code className="text-sm font-mono">
                            {item.endpoint}
                          </code>
                        </div>
                        <Badge variant="secondary">{item.count} requests</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
