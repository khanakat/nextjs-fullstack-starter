import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Lock,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  MapPin,
  Wifi,
  RefreshCw,
  Download,
  Filter,
  Calendar,
} from "lucide-react";

interface SecurityMetrics {
  totalUsers: number;
  activeUsers: number;
  mfaEnabled: number;
  securityEvents: number;
  riskScore: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentEvents: SecurityEvent[];
  topThreats: ThreatInfo[];
  complianceScore: number;
  auditLogs: number;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  resolved: boolean;
}

interface ThreatInfo {
  type: string;
  count: number;
  severity: "low" | "medium" | "high" | "critical";
  trend: "up" | "down" | "stable";
}

interface SecurityDashboardProps {
  organizationId?: string;
  refreshInterval?: number;
}

export default function SecurityDashboard({
  organizationId,
  refreshInterval = 30000,
}: SecurityDashboardProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedEventType, setSelectedEventType] = useState("all");

  const loadMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(organizationId && { organizationId }),
      });

      const response = await fetch(`/api/security/dashboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
        setError("");
      } else {
        setError("Failed to load security metrics");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [timeRange, organizationId]);

  useEffect(() => {
    loadMetrics();

    if (autoRefresh) {
      const interval = setInterval(loadMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [organizationId, timeRange, autoRefresh, refreshInterval, loadMetrics]);

  const exportReport = async () => {
    try {
      const params = new URLSearchParams({
        timeRange,
        format: "pdf",
        ...(organizationId && { organizationId }),
      });

      const response = await fetch(`/api/security/reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `security-report-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      setError("Failed to export report");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const filteredEvents =
    metrics?.recentEvents.filter(
      (event) =>
        selectedEventType === "all" || event.type === selectedEventType,
    ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading security dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadMetrics}
            className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Security Dashboard
          </h2>
          <p className="text-gray-600">
            Real-time security monitoring and threat detection
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={loadMetrics}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="flex items-center space-x-4">
        <Calendar className="h-4 w-4 text-gray-400" />
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Risk Score</p>
              <p
                className={`text-3xl font-bold ${getRiskScoreColor(metrics.riskScore)}`}
              >
                {metrics.riskScore}
              </p>
            </div>
            <Shield
              className={`h-8 w-8 ${getRiskScoreColor(metrics.riskScore)}`}
            />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metrics.riskScore >= 80
                    ? "bg-red-500"
                    : metrics.riskScore >= 60
                      ? "bg-orange-500"
                      : metrics.riskScore >= 40
                        ? "bg-yellow-500"
                        : "bg-green-500"
                }`}
                style={{ width: `${metrics.riskScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics.activeUsers}
              </p>
              <p className="text-xs text-gray-500">
                of {metrics.totalUsers} total
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">MFA Enabled</p>
              <p className="text-3xl font-bold text-green-600">
                {metrics.mfaEnabled}
              </p>
              <p className="text-xs text-gray-500">
                {Math.round((metrics.mfaEnabled / metrics.totalUsers) * 100)}%
                coverage
              </p>
            </div>
            <Lock className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Security Events</p>
              <p className="text-3xl font-bold text-orange-600">
                {metrics.securityEvents}
              </p>
              <p className="text-xs text-gray-500">in selected period</p>
            </div>
            <Activity className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Vulnerabilities & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vulnerabilities
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Critical</span>
              </div>
              <span className="font-semibold text-red-600">
                {metrics.vulnerabilities.critical}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">High</span>
              </div>
              <span className="font-semibold text-orange-600">
                {metrics.vulnerabilities.high}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Medium</span>
              </div>
              <span className="font-semibold text-yellow-600">
                {metrics.vulnerabilities.medium}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Low</span>
              </div>
              <span className="font-semibold text-green-600">
                {metrics.vulnerabilities.low}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Score
          </h3>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-32 h-32">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-gray-300"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${metrics.complianceScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.complianceScore}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Overall compliance rating
            </p>
          </div>
        </div>
      </div>

      {/* Top Threats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Threats
        </h3>
        <div className="space-y-3">
          {metrics.topThreats.map((threat, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(threat.severity)}`}
                >
                  {threat.severity.toUpperCase()}
                </span>
                <span className="font-medium text-gray-900">{threat.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {threat.count} events
                </span>
                {getTrendIcon(threat.trend)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Security Events
          </h3>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Events</option>
              <option value="login">Login Events</option>
              <option value="access">Access Events</option>
              <option value="security">Security Events</option>
              <option value="data">Data Events</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No events found</p>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    event.severity === "critical"
                      ? "bg-red-500"
                      : event.severity === "high"
                        ? "bg-orange-500"
                        : event.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {event.description}
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}
                    >
                      {event.severity}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    {event.userEmail && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{event.userEmail}</span>
                      </div>
                    )}
                    {event.ipAddress && (
                      <div className="flex items-center space-x-1">
                        <Wifi className="h-3 w-3" />
                        <span>{event.ipAddress}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!event.resolved && (
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    <Eye className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
