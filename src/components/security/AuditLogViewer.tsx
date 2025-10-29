import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Eye,
  User,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  MapPin,
  Globe,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: {
    [key: string]: any;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceInfo?: string;
    sessionId?: string;
    organizationId?: string;
  };
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "authentication"
    | "authorization"
    | "data_access"
    | "data_modification"
    | "system"
    | "security";
  timestamp: string;
  success: boolean;
  riskScore: number;
}

interface AuditLogFilters {
  search: string;
  userId?: string;
  action?: string;
  resource?: string;
  category?: string;
  severity?: string;
  success?: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  riskScoreRange: {
    min: number;
    max: number;
  };
}

interface AuditLogViewerProps {
  organizationId?: string;
  userId?: string;
  resource?: string;
  maxHeight?: string;
}

export default function AuditLogViewer({
  organizationId,
  userId,
  resource,
  maxHeight = "600px",
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50);

  const [filters, setFilters] = useState<AuditLogFilters>({
    search: "",
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
    riskScoreRange: {
      min: 0,
      max: 100,
    },
  });

  const [availableFilters, setAvailableFilters] = useState({
    users: [] as { id: string; email: string; name: string }[],
    actions: [] as string[],
    resources: [] as string[],
    categories: [
      "authentication",
      "authorization",
      "data_access",
      "data_modification",
      "system",
      "security",
    ],
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(organizationId && { organizationId }),
        ...(userId && { userId }),
        ...(resource && { resource }),
        ...(filters.search && { search: filters.search }),
        ...(filters.userId && { filterUserId: filters.userId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { filterResource: filters.resource }),
        ...(filters.category && { category: filters.category }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.success !== undefined && {
          success: filters.success.toString(),
        }),
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        minRiskScore: filters.riskScoreRange.min.toString(),
        maxRiskScore: filters.riskScoreRange.max.toString(),
      });

      const response = await fetch(`/api/security/audit/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setError("");
      } else {
        setError("Failed to load audit logs");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId, resource, filters, currentPage, pageSize]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(organizationId && { organizationId }),
      });

      const response = await fetch(`/api/security/audit/filters?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableFilters((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  }, [organizationId]);

  useEffect(() => {
    loadLogs();
    loadFilterOptions();
  }, [
    organizationId,
    userId,
    resource,
    filters,
    currentPage,
    loadLogs,
    loadFilterOptions,
  ]);

  const exportLogs = async (format: "csv" | "json" = "csv") => {
    try {
      const params = new URLSearchParams({
        format,
        ...(organizationId && { organizationId }),
        ...(userId && { userId }),
        ...(resource && { resource }),
        ...(filters.search && { search: filters.search }),
        ...(filters.userId && { filterUserId: filters.userId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { filterResource: filters.resource }),
        ...(filters.category && { category: filters.category }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.success !== undefined && {
          success: filters.success.toString(),
        }),
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        minRiskScore: filters.riskScoreRange.min.toString(),
        maxRiskScore: filters.riskScoreRange.max.toString(),
      });

      const response = await fetch(`/api/security/audit/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to export logs");
      }
    } catch (error) {
      setError("Network error occurred");
    }
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-100 border-green-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "authentication":
        return <User className="h-4 w-4" />;
      case "authorization":
        return <Shield className="h-4 w-4" />;
      case "data_access":
        return <Eye className="h-4 w-4" />;
      case "data_modification":
        return <Activity className="h-4 w-4" />;
      case "system":
        return <Globe className="h-4 w-4" />;
      case "security":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const formatDetails = (details: any) => {
    return Object.entries(details).map(([key, value]) => (
      <div key={key} className="flex justify-between py-1">
        <span className="text-sm font-medium text-gray-600 capitalize">
          {key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())}
          :
        </span>
        <span className="text-sm text-gray-900">
          {typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value)}
        </span>
      </div>
    ));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        end: new Date().toISOString().split("T")[0],
      },
      riskScoreRange: {
        min: 0,
        max: 100,
      },
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log Viewer</h2>
          <p className="text-gray-600">
            Monitor and analyze system activities and security events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => exportLogs("csv")}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportLogs("json")}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search logs..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              value={filters.userId || ""}
              onChange={(e) =>
                setFilters({ ...filters, userId: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              {availableFilters.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filters.action || ""}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              {availableFilters.actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {availableFilters.categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filters.severity || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  severity: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {logs.length} of {totalCount} logs
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow" style={{ maxHeight }}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
        </div>

        <div
          className="divide-y divide-gray-200 overflow-y-auto"
          style={{ maxHeight: `calc(${maxHeight} - 80px)` }}
        >
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogs.has(log.id);
              return (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getCategoryIcon(log.category)}
                        <span className="font-medium text-gray-900">
                          {log.action}
                        </span>
                        <span className="text-gray-500">on</span>
                        <span className="font-medium text-blue-600">
                          {log.resource}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(log.severity)}`}
                        >
                          {log.severity}
                        </span>
                        <span
                          className={`text-sm font-medium ${getRiskScoreColor(log.riskScore)}`}
                        >
                          Risk: {log.riskScore}
                        </span>
                        {log.success ? (
                          <span className="text-green-600 text-sm">
                            ✓ Success
                          </span>
                        ) : (
                          <span className="text-red-600 text-sm">✗ Failed</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        {log.userEmail && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{log.userName || log.userEmail}</span>
                          </div>
                        )}
                        {log.metadata.ipAddress && (
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{log.metadata.ipAddress}</span>
                          </div>
                        )}
                        {log.metadata.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{log.metadata.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Details
                              </h4>
                              <div className="space-y-1">
                                {formatDetails(log.details)}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Metadata
                              </h4>
                              <div className="space-y-1">
                                {log.metadata.userAgent && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-sm font-medium text-gray-600">
                                      User Agent:
                                    </span>
                                    <span
                                      className="text-sm text-gray-900 truncate max-w-xs"
                                      title={log.metadata.userAgent}
                                    >
                                      {log.metadata.userAgent}
                                    </span>
                                  </div>
                                )}
                                {log.metadata.deviceInfo && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-sm font-medium text-gray-600">
                                      Device:
                                    </span>
                                    <span className="text-sm text-gray-900">
                                      {log.metadata.deviceInfo}
                                    </span>
                                  </div>
                                )}
                                {log.metadata.sessionId && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-sm font-medium text-gray-600">
                                      Session ID:
                                    </span>
                                    <span className="text-sm text-gray-900 font-mono">
                                      {log.metadata.sessionId}
                                    </span>
                                  </div>
                                )}
                                {log.resourceId && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-sm font-medium text-gray-600">
                                      Resource ID:
                                    </span>
                                    <span className="text-sm text-gray-900 font-mono">
                                      {log.resourceId}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleLogExpansion(log.id)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Audit Log Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Basic Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Action:
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedLog.action}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Resource:
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedLog.resource}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Category:
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedLog.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Severity:
                      </span>
                      <span
                        className={`text-sm font-medium ${getSeverityColor(selectedLog.severity).split(" ")[0]}`}
                      >
                        {selectedLog.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Risk Score:
                      </span>
                      <span
                        className={`text-sm font-medium ${getRiskScoreColor(selectedLog.riskScore)}`}
                      >
                        {selectedLog.riskScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Success:
                      </span>
                      <span
                        className={`text-sm font-medium ${selectedLog.success ? "text-green-600" : "text-red-600"}`}
                      >
                        {selectedLog.success ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Timestamp:
                      </span>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    User Information
                  </h4>
                  <div className="space-y-2">
                    {selectedLog.userEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Email:
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedLog.userEmail}
                        </span>
                      </div>
                    )}
                    {selectedLog.userName && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Name:
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedLog.userName}
                        </span>
                      </div>
                    )}
                    {selectedLog.metadata.ipAddress && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          IP Address:
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedLog.metadata.ipAddress}
                        </span>
                      </div>
                    )}
                    {selectedLog.metadata.location && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Location:
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedLog.metadata.location}
                        </span>
                      </div>
                    )}
                    {selectedLog.metadata.deviceInfo && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Device:
                        </span>
                        <span className="text-sm text-gray-900">
                          {selectedLog.metadata.deviceInfo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Details</h4>
                <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              {selectedLog.metadata.userAgent && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">User Agent</h4>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4">
                    {selectedLog.metadata.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
