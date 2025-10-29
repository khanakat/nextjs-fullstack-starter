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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Shield,
  Activity,
  Users,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Eye,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  AuditLogWithRelations,
  AuditLogStats,
  AuditLogFilters,
  AuditLogSeverity,
  AuditLogCategory,
  AuditLogStatus,
  ExportFormat,
} from "@/lib/types/audit";
import { AuditEventModal } from "./audit-event-modal";

// ============================================================================
// TYPES
// ============================================================================

interface AuditDashboardProps {
  organizationId?: string;
}

// ============================================================================
// AUDIT DASHBOARD COMPONENT
// ============================================================================

export function AuditDashboard({ organizationId }: AuditDashboardProps) {
  const [logs, setLogs] = useState<AuditLogWithRelations[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("logs");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            queryParams.set(key, value.join(","));
          } else {
            queryParams.set(key, value.toString());
          }
        }
      });

      if (organizationId) {
        queryParams.set("organizationId", organizationId);
      }

      if (selectedDateRange.from) {
        queryParams.set("startDate", selectedDateRange.from.toISOString());
      }
      if (selectedDateRange.to) {
        queryParams.set("endDate", selectedDateRange.to.toISOString());
      }

      if (searchQuery) {
        queryParams.set("search", searchQuery);
      }

      const response = await fetch(`/api/audit/logs?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");

      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [filters, selectedDateRange, searchQuery, organizationId]);

  const fetchStats = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();

      if (organizationId) {
        queryParams.set("organizationId", organizationId);
      }

      if (selectedDateRange.from) {
        queryParams.set("startDate", selectedDateRange.from.toISOString());
      }
      if (selectedDateRange.to) {
        queryParams.set("endDate", selectedDateRange.to.toISOString());
      }

      const response = await fetch(`/api/audit/stats?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch audit stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching audit stats:", error);
      toast.error("Failed to fetch audit statistics");
    }
  }, [organizationId, selectedDateRange]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination
    }));
  };

  // const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
  //   setSelectedDateRange(range)
  //   setFilters(prev => ({
  //     ...prev,
  //     startDate: range.from,
  //     endDate: range.to
  //   }))
  //   setPagination(prev => ({ ...prev, page: 1 }))
  // }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedLogId(null);
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setExporting(true);

      const exportFilters = {
        ...filters,
        organizationId,
        startDate: selectedDateRange.from?.toISOString(),
        endDate: selectedDateRange.to?.toISOString(),
        search: searchQuery,
        format,
        limit: 10000, // Export more records
      };

      const response = await fetch("/api/audit/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportFilters),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${format}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (logId: string) => {
    // Open log details in a modal
    setSelectedLogId(logId);
    setShowDetailsModal(true);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case AuditLogSeverity.CRITICAL:
        return "bg-red-100 text-red-800 border-red-200";
      case AuditLogSeverity.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case AuditLogSeverity.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case AuditLogSeverity.LOW:
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case AuditLogStatus.SUCCESS:
        return "bg-green-100 text-green-800 border-green-200";
      case AuditLogStatus.FAILURE:
        return "bg-red-100 text-red-800 border-red-200";
      case AuditLogStatus.WARNING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case AuditLogCategory.SECURITY:
        return <Shield className="h-4 w-4" />;
      case AuditLogCategory.USER:
        return <Users className="h-4 w-4" />;
      case AuditLogCategory.SYSTEM:
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and analyze system activity and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchLogs();
              if (activeTab === "analytics") fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport(ExportFormat.CSV)}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(ExportFormat.JSON)}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={(filters.category as string) || ""}
                onValueChange={(value) =>
                  handleFilterChange("category", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {Object.values(AuditLogCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select
                value={(filters.severity as string) || ""}
                onValueChange={(value) =>
                  handleFilterChange("severity", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  {Object.values(AuditLogSeverity).map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDateRange.from ? (
                      selectedDateRange.to ? (
                        <>
                          {format(selectedDateRange.from, "LLL dd, y")} -{" "}
                          {format(selectedDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(selectedDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={selectedDateRange.from}
                    selected={selectedDateRange as any}
                    onSelect={setSelectedDateRange as any}
                    numberOfMonths={2}
                    required={false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest audit log entries matching your filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading audit logs...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(
                              new Date(log.createdAt),
                              "MMM dd, HH:mm:ss",
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.action}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(log.category)}
                              {log.resource}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div>
                                <div className="font-medium">
                                  {log.user.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {log.user.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                System
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getSeverityColor(log.category)}
                            >
                              {log.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getSeverityColor(log.severity)}
                            >
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(log.status)}
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => handleViewDetails(log.id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {logs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit logs found matching your filters
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Events
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalLogs.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Security Events
                    </CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.logsByCategory[
                        AuditLogCategory.SECURITY
                      ]?.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Critical Events
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.logsBySeverity[
                        AuditLogSeverity.CRITICAL
                      ]?.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.topUsers.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topActions.slice(0, 10).map((action) => (
                        <div
                          key={action.action}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{action.action}</span>
                          <Badge variant="secondary">{action.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Users */}
                <Card>
                  <CardHeader>
                    <CardTitle>Most Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topUsers.slice(0, 10).map((user) => (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{user.userName}</span>
                          <Badge variant="secondary">{user.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Audit Event Details Modal */}
      <AuditEventModal
        logId={selectedLogId}
        open={showDetailsModal}
        onOpenChange={handleCloseDetailsModal}
      />
    </div>
  );
}
