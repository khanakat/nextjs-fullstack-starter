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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IntegrationLog {
  id: string;
  integrationId: string;
  integrationName: string;
  provider: string;
  level: "info" | "warning" | "error" | "success";
  message: string;
  details?: any;
  timestamp: string;
  duration?: number;
  dataSize?: number;
  endpoint?: string;
  statusCode?: number;
}

interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  dataTransferred: number;
  uptime: number;
  errorRate: number;
  requestsPerHour: Array<{ hour: string; requests: number; errors: number }>;
  providerBreakdown: Array<{
    provider: string;
    requests: number;
    color: string;
  }>;
  statusCodeDistribution: Array<{ code: number; count: number }>;
  performanceTrends: Array<{
    date: string;
    responseTime: number;
    throughput: number;
  }>;
}

interface IntegrationMonitoringDashboardProps {
  organizationId?: string;
}

export default function IntegrationMonitoringDashboard({
  organizationId,
}: IntegrationMonitoringDashboardProps) {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [logsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/integrations/logs?timeRange=${timeRange}`),
        fetch(`/api/integrations/metrics?timeRange=${timeRange}`),
      ]);

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error("Failed to load monitoring data:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [organizationId, timeRange, autoRefresh, loadData]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.integrationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesProvider =
      providerFilter === "all" || log.provider === providerFilter;
    return matchesSearch && matchesLevel && matchesProvider;
  });

  const exportLogs = () => {
    const csvContent = [
      [
        "Timestamp",
        "Integration",
        "Provider",
        "Level",
        "Message",
        "Duration",
        "Status Code",
      ].join(","),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.integrationName,
          log.provider,
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          log.duration || "",
          log.statusCode || "",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `integration-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Monitoring</h2>
          <p className="text-gray-600">
            Real-time monitoring and analytics for your integrations
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 border-green-200" : ""}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>

          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">
                    {metrics.totalRequests.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last period
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(
                      (metrics.successfulRequests / metrics.totalRequests) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.3% from last period
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold">
                    {metrics.averageResponseTime}ms
                  </p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    +15ms from last period
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Data Transferred</p>
                  <p className="text-2xl font-bold">
                    {(metrics.dataTransferred / 1024 / 1024).toFixed(1)}MB
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8% from last period
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Request Volume</CardTitle>
              <CardDescription>Requests and errors over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.requestsPerHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Requests"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stackId="1"
                    stroke="#ff7c7c"
                    fill="#ff7c7c"
                    name="Errors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Provider Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Breakdown</CardTitle>
              <CardDescription>
                Requests by integration provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={metrics.providerBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ provider, percent }) =>
                      `${provider} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="requests"
                  >
                    {metrics.providerBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Response time and throughput over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#8884d8"
                    name="Response Time (ms)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="throughput"
                    stroke="#82ca9d"
                    name="Throughput (req/min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Integration Logs</CardTitle>
              <CardDescription>
                Real-time logs from all integrations
              </CardDescription>
            </div>
            <Button onClick={exportLogs} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>

            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Providers</option>
              {Array.from(new Set(logs.map((log) => log.provider))).map(
                (provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Logs List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No logs found matching your criteria
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getLevelIcon(log.level)}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {log.integrationName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.provider}
                        </Badge>
                        <Badge
                          className={`text-xs ${getLevelColor(log.level)}`}
                        >
                          {log.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {log.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    {log.duration && (
                      <div className="text-xs">{log.duration}ms</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getLevelIcon(selectedLog.level)}
              Log Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Integration
                  </label>
                  <p className="font-medium">{selectedLog.integrationName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Provider
                  </label>
                  <p className="font-medium">{selectedLog.provider}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Level
                  </label>
                  <Badge className={getLevelColor(selectedLog.level)}>
                    {selectedLog.level}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Timestamp
                  </label>
                  <p className="font-medium">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                {selectedLog.duration && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Duration
                    </label>
                    <p className="font-medium">{selectedLog.duration}ms</p>
                  </div>
                )}
                {selectedLog.statusCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status Code
                    </label>
                    <p className="font-medium">{selectedLog.statusCode}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Message
                </label>
                <p className="mt-1 p-3 bg-gray-50 rounded-md">
                  {selectedLog.message}
                </p>
              </div>

              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Details
                  </label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
