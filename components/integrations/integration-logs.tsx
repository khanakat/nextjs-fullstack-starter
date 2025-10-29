"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Activity,
} from "lucide-react";
import { IntegrationLog } from "@/lib/types/integrations";

interface IntegrationLogsProps {
  integrationId?: string;
  className?: string;
}

interface LogFilters {
  status: string;
  action: string;
  dateRange: string;
  search: string;
}

const IntegrationLogs: React.FC<IntegrationLogsProps> = ({
  integrationId,
  className = "",
}) => {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    status: "all",
    action: "all",
    dateRange: "today",
    search: "",
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (integrationId) {
        params.set("integrationId", integrationId);
      }

      const response = await fetch(
        `/api/integrations/logs?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to load integration logs:", error);
    } finally {
      setLoading(false);
    }
  }, [integrationId]);

  const applyFilters = useCallback(() => {
    let filtered = [...logs];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((log) => log.status === filters.status);
    }

    // Action filter
    if (filters.action !== "all") {
      filtered = filtered.filter((log) => log.action === filters.action);
    }

    // Date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (filters.dateRange) {
      case "today":
        filtered = filtered.filter((log) => new Date(log.timestamp) >= today);
        break;
      case "yesterday":
        filtered = filtered.filter((log) => {
          const logDate = new Date(log.timestamp);
          return logDate >= yesterday && logDate < today;
        });
        break;
      case "week":
        filtered = filtered.filter((log) => new Date(log.timestamp) >= weekAgo);
        break;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchLower) ||
          log.error?.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.requestData).toLowerCase().includes(searchLower) ||
          JSON.stringify(log.responseData).toLowerCase().includes(searchLower),
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    setFilteredLogs(filtered);
  }, [logs, filters]);

  // Load logs
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [applyFilters, logs, filters]);

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewLog = (log: IntegrationLog) => {
    setSelectedLog(log);
    setShowLogDetail(true);
  };

  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (integrationId) {
        params.set("integrationId", integrationId);
      }
      params.set("format", "csv");

      const response = await fetch(
        `/api/integrations/logs/export?${params.toString()}`,
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `integration-logs-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export logs:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      success: "default",
      error: "destructive",
      warning: "secondary",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`;
    }
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Integration Logs
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-64"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.action}
              onValueChange={(value) => handleFilterChange("action", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => handleFilterChange("dateRange", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              {filteredLogs.length} of {logs.length} logs
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading logs...
                </span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found matching your filters.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card
                  key={log.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {log.action
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          {getStatusBadge(log.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <span>Duration: {formatDuration(log.duration)}</span>
                          {log.error && (
                            <span className="text-red-600 truncate max-w-xs">
                              Error: {log.error}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={showLogDetail} onOpenChange={setShowLogDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getStatusIcon(selectedLog.status)}
              Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Action:</strong> {selectedLog.action}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        {getStatusBadge(selectedLog.status)}
                      </div>
                      <div>
                        <strong>Timestamp:</strong>{" "}
                        {formatTimestamp(selectedLog.timestamp)}
                      </div>
                      <div>
                        <strong>Duration:</strong>{" "}
                        {formatDuration(selectedLog.duration)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Integration</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Integration ID:</strong>{" "}
                        {selectedLog.integrationId}
                      </div>
                      {selectedLog.error && (
                        <div className="text-red-600">
                          <strong>Error:</strong> {selectedLog.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {selectedLog.requestData && (
                  <div>
                    <h4 className="font-medium mb-2">Request Data</h4>
                    <pre className="bg-muted p-3 rounded-md text-sm overflow-auto">
                      {JSON.stringify(selectedLog.requestData, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.responseData && (
                  <div>
                    <h4 className="font-medium mb-2">Response Data</h4>
                    <pre className="bg-muted p-3 rounded-md text-sm overflow-auto">
                      {JSON.stringify(selectedLog.responseData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationLogs;
