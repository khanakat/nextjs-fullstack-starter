import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  BarChart3,
  Shield,
  Clock,
} from "lucide-react";

interface ComplianceReport {
  id: string;
  type: "SOC2" | "GDPR" | "HIPAA" | "PCI_DSS" | "ISO27001" | "CUSTOM";
  title: string;
  description: string;
  period: {
    start: string;
    end: string;
  };
  status: "generating" | "completed" | "failed";
  score: number;
  findings: ComplianceFinding[];
  recommendations: string[];
  generatedAt: string;
  organizationId?: string;
  metadata: {
    totalControls: number;
    passedControls: number;
    failedControls: number;
    warningControls: number;
    dataPoints: number;
    auditTrail: number;
  };
}

interface ComplianceFinding {
  id: string;
  control: string;
  requirement: string;
  status: "pass" | "fail" | "warning" | "not_applicable";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence?: string[];
  remediation?: string;
  dueDate?: string;
}

interface ComplianceMetrics {
  overallScore: number;
  totalReports: number;
  activeFindings: number;
  resolvedFindings: number;
  complianceByFramework: {
    [key: string]: {
      score: number;
      lastAssessment: string;
      status: "compliant" | "non_compliant" | "partial";
    };
  };
  trendData: {
    date: string;
    score: number;
  }[];
}

interface ComplianceReporterProps {
  organizationId?: string;
}

export default function ComplianceReporter({
  organizationId,
}: ComplianceReporterProps) {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, _setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // New report form
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [newReportData, setNewReportData] = useState({
    type: "SOC2" as ComplianceReport["type"],
    title: "",
    description: "",
    period: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(organizationId && { organizationId }),
        ...(filterType !== "all" && { type: filterType }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      });

      const response = await fetch(
        `/api/security/compliance/reports?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        setError("Failed to load compliance reports");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [organizationId, filterType, filterStatus]);

  const loadMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(organizationId && { organizationId }),
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(
        `/api/security/compliance/metrics?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  }, [organizationId, dateRange.start, dateRange.end]);

  useEffect(() => {
    loadReports();
    loadMetrics();
  }, [organizationId, filterType, filterStatus, loadReports, loadMetrics]);

  const generateReport = async () => {
    if (!newReportData.title.trim()) {
      setError("Report title is required");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/security/compliance/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newReportData,
          organizationId,
        }),
      });

      if (response.ok) {
        setSuccess("Report generation started. This may take a few minutes.");
        setShowNewReportForm(false);
        setNewReportData({
          type: "SOC2",
          title: "",
          description: "",
          period: {
            start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            end: new Date().toISOString().split("T")[0],
          },
        });
        loadReports();
      } else {
        const error = await response.json();
        setError(error.message || "Failed to generate report");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (
    reportId: string,
    format: "pdf" | "csv" | "json" = "pdf",
  ) => {
    try {
      const response = await fetch(
        `/api/security/compliance/reports/${reportId}/export?format=${format}`,
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compliance-report-${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to download report");
      }
    } catch (error) {
      setError("Network error occurred");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
      case "completed":
      case "compliant":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "fail":
      case "failed":
      case "non_compliant":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
      case "completed":
      case "compliant":
        return "text-green-600 bg-green-100";
      case "warning":
      case "partial":
        return "text-yellow-600 bg-yellow-100";
      case "fail":
      case "failed":
      case "non_compliant":
        return "text-red-600 bg-red-100";
      case "generating":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
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

  const filteredReports = reports.filter((report) => {
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const renderNewReportForm = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Generate New Compliance Report
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compliance Framework *
            </label>
            <select
              value={newReportData.type}
              onChange={(e) =>
                setNewReportData({
                  ...newReportData,
                  type: e.target.value as ComplianceReport["type"],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SOC2">SOC 2</option>
              <option value="GDPR">GDPR</option>
              <option value="HIPAA">HIPAA</option>
              <option value="PCI_DSS">PCI DSS</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Title *
            </label>
            <input
              type="text"
              value={newReportData.title}
              onChange={(e) =>
                setNewReportData({ ...newReportData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter report title"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={newReportData.description}
            onChange={(e) =>
              setNewReportData({
                ...newReportData,
                description: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter report description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Start
            </label>
            <input
              type="date"
              value={newReportData.period.start}
              onChange={(e) =>
                setNewReportData({
                  ...newReportData,
                  period: { ...newReportData.period, start: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period End
            </label>
            <input
              type="date"
              value={newReportData.period.end}
              onChange={(e) =>
                setNewReportData({
                  ...newReportData,
                  period: { ...newReportData.period, end: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => setShowNewReportForm(false)}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={generateReport}
          disabled={generating || !newReportData.title.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </div>
  );

  const renderReportDetails = (report: ComplianceReport) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {report.title}
          </h3>
          <p className="text-gray-600">{report.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadReport(report.id, "pdf")}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => downloadReport(report.id, "csv")}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Report Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {report.score}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Passed Controls</p>
              <p className="text-2xl font-bold text-green-600">
                {report.metadata.passedControls}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed Controls</p>
              <p className="text-2xl font-bold text-red-600">
                {report.metadata.failedControls}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {report.metadata.warningControls}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">
          Key Findings
        </h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {report.findings.map((finding) => (
            <div
              key={finding.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(finding.status)}
                    <span className="font-medium text-gray-900">
                      {finding.control}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(finding.severity)}`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {finding.description}
                  </p>
                  <p className="text-xs text-gray-500">{finding.requirement}</p>
                  {finding.remediation && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      <strong>Remediation:</strong> {finding.remediation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Recommendations
          </h4>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Compliance Reporter
          </h2>
          <p className="text-gray-600">
            Generate and manage compliance reports
          </p>
        </div>
        <button
          onClick={() => setShowNewReportForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" />
          <span>New Report</span>
        </button>
      </div>

      {/* Alerts */}
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* New Report Form */}
      {showNewReportForm && renderNewReportForm()}

      {/* Report Details */}
      {selectedReport && renderReportDetails(selectedReport)}

      {/* Compliance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Score</p>
                <p className="text-3xl font-bold text-blue-600">
                  {metrics.overallScore}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.totalReports}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Findings</p>
                <p className="text-3xl font-bold text-orange-600">
                  {metrics.activeFindings}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved Findings</p>
                <p className="text-3xl font-bold text-green-600">
                  {metrics.resolvedFindings}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Compliance by Framework */}
      {metrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance by Framework
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metrics.complianceByFramework).map(
              ([framework, data]) => (
                <div
                  key={framework}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{framework}</h4>
                    {getStatusIcon(data.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {data.score}%
                    </span>
                    <span className="text-xs text-gray-500">
                      Last: {new Date(data.lastAssessment).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          data.score >= 80
                            ? "bg-green-500"
                            : data.score >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Frameworks</option>
            <option value="SOC2">SOC 2</option>
            <option value="GDPR">GDPR</option>
            <option value="HIPAA">HIPAA</option>
            <option value="PCI_DSS">PCI DSS</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="CUSTOM">Custom</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="generating">Generating</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={loadReports}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Compliance Reports
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}
                      >
                        {report.type}
                      </span>
                      <h4 className="font-medium text-gray-900">
                        {report.title}
                      </h4>
                      {getStatusIcon(report.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Score: {report.score}%</span>
                      <span>
                        Period:{" "}
                        {new Date(report.period.start).toLocaleDateString()} -{" "}
                        {new Date(report.period.end).toLocaleDateString()}
                      </span>
                      <span>
                        Generated:{" "}
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setSelectedReport(
                          selectedReport?.id === report.id ? null : report,
                        )
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {report.status === "completed" && (
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
