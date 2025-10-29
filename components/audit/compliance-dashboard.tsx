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
import { Separator } from "@/components/ui/separator";

import { toast } from "sonner";
import {
  Shield,
  FileText,
  Calendar as CalendarIcon,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { ComplianceReport } from "@/lib/types/audit";

// ============================================================================
// TYPES
// ============================================================================

interface ComplianceDashboardProps {
  organizationId?: string;
}

interface ComplianceStandard {
  value: string;
  label: string;
  description: string;
  categories: string[];
}

interface ExportFormat {
  value: string;
  label: string;
  description: string;
  mimeType: string;
  disabled?: boolean;
}

// ============================================================================
// COMPLIANCE DASHBOARD COMPONENT
// ============================================================================

export function ComplianceDashboard({
  organizationId,
}: ComplianceDashboardProps) {
  const [standards, setStandards] = useState<ComplianceStandard[]>([]);
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("json");
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("generate");

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchComplianceInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/audit/compliance");
      if (!response.ok) throw new Error("Failed to fetch compliance info");

      const data = await response.json();
      setStandards(data.standards);
      setExportFormats(data.exportFormats);

      if (data.standards.length > 0 && !selectedStandard) {
        setSelectedStandard(data.standards[0].value);
      }
    } catch (error) {
      console.error("Error fetching compliance info:", error);
      toast.error("Failed to fetch compliance information");
    } finally {
      setLoading(false);
    }
  }, [selectedStandard]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchComplianceInfo();
  }, [fetchComplianceInfo]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGenerateReport = async () => {
    if (!selectedStandard) {
      toast.error("Please select a compliance standard");
      return;
    }

    try {
      setGenerating(true);

      const requestData = {
        standard: selectedStandard,
        organizationId,
        startDate: selectedDateRange.from?.toISOString(),
        endDate: selectedDateRange.to?.toISOString(),
        format: selectedFormat,
      };

      const response = await fetch("/api/audit/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) throw new Error("Failed to generate compliance report");

      if (selectedFormat === "json") {
        const report = await response.json();
        setReports((prev) => [report, ...prev]);
        setActiveTab("reports");
        toast.success("Compliance report generated successfully");
      } else {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compliance-report-${selectedStandard.toLowerCase()}-${new Date().toISOString().split("T")[0]}.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(
          `Compliance report exported as ${selectedFormat.toUpperCase()}`,
        );
      }
    } catch (error) {
      console.error("Error generating compliance report:", error);
      toast.error("Failed to generate compliance report");
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = (report: ComplianceReport) => {
    // Open report in a new tab or modal
    const reportWindow = window.open("", "_blank");
    if (reportWindow) {
      reportWindow.document.write(`
        <html>
          <head>
            <title>Compliance Report - ${report.standard}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin-bottom: 30px; }
              .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              .finding { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 5px 0; border-radius: 5px; }
              .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; margin: 5px 0; border-radius: 5px; }
              pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Compliance Report - ${report.standard}</h1>
              <p>Generated: ${format(new Date(report.generatedAt), "PPpp")}</p>
              <p>Period: ${format(new Date((report as any).reportPeriod?.startDate || new Date()), "PPP")} - ${format(new Date((report as any).reportPeriod?.endDate || new Date()), "PPP")}</p>
            </div>
            
            <div class="section">
              <h2>Summary</h2>
              <div class="metric">Total Events: ${report.summary.totalEvents}</div>
              <div class="metric">Critical Events: ${report.summary.criticalEvents}</div>
              <div class="metric">Compliance Score: ${report.summary.complianceScore}%</div>
              <div class="metric">Risk Level: ${report.summary.riskLevel}</div>
            </div>

            ${
              report.findings.length > 0
                ? `
            <div class="section">
              <h2>Findings</h2>
              ${report.findings
                .map(
                  (finding: any) => `
                <div class="finding">
                  <strong>${finding.severity}</strong> - ${finding.category || "N/A"}<br>
                  ${finding.description}<br>
                  <small>Count: ${finding.count || 0}</small>
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }

            ${
              report.recommendations.length > 0
                ? `
            <div class="section">
              <h2>Recommendations</h2>
              ${report.recommendations
                .map(
                  (rec, index) => `
                <div class="recommendation">
                  ${index + 1}. ${rec}
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }

            <div class="section">
              <h2>Detailed Report</h2>
              <pre>${JSON.stringify(report, null, 2)}</pre>
            </div>
          </body>
        </html>
      `);
      reportWindow.document.close();
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading compliance dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Generate and manage compliance reports for various standards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchComplianceInfo}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="standards">Standards Info</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Compliance Report
              </CardTitle>
              <CardDescription>
                Create a comprehensive compliance report for your selected
                standard and time period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Compliance Standard */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Compliance Standard
                  </label>
                  <Select
                    value={selectedStandard}
                    onValueChange={setSelectedStandard}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a compliance standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {standards.map((standard) => (
                        <SelectItem key={standard.value} value={standard.value}>
                          {standard.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStandard && (
                    <p className="text-sm text-muted-foreground">
                      {
                        standards.find((s) => s.value === selectedStandard)
                          ?.description
                      }
                    </p>
                  )}
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select
                    value={selectedFormat}
                    onValueChange={setSelectedFormat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select export format" />
                    </SelectTrigger>
                    <SelectContent>
                      {exportFormats.map((format) => (
                        <SelectItem
                          key={format.value}
                          value={format.value}
                          disabled={format.disabled}
                        >
                          {format.label}
                          {format.disabled && " (Coming Soon)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFormat && (
                    <p className="text-sm text-muted-foreground">
                      {
                        exportFormats.find((f) => f.value === selectedFormat)
                          ?.description
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Period</label>
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating || !selectedStandard}
                  size="lg"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Compliance Reports</CardTitle>
              <CardDescription>
                View and manage your generated compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No compliance reports generated yet</p>
                  <p className="text-sm">
                    Generate your first report using the Generate Report tab
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card
                      key={report.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{report.standard}</Badge>
                              <Badge
                                variant="outline"
                                className={getRiskLevelColor(
                                  report.summary.riskLevel,
                                )}
                              >
                                {report.summary.riskLevel} Risk
                              </Badge>
                            </div>
                            <h3 className="font-semibold">
                              {standards.find(
                                (s) => s.value === report.standard,
                              )?.label || report.standard}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Generated:{" "}
                              {format(new Date(report.generatedAt), "PPp")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Period:{" "}
                              {format(
                                new Date(
                                  (report as any).reportPeriod?.startDate ||
                                    new Date(),
                                ),
                                "MMM dd",
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(
                                  (report as any).reportPeriod?.endDate ||
                                    new Date(),
                                ),
                                "MMM dd, yyyy",
                              )}
                            </p>
                          </div>

                          <div className="text-right space-y-2">
                            <div
                              className={`text-2xl font-bold ${getComplianceScoreColor(report.summary.complianceScore)}`}
                            >
                              {report.summary.complianceScore}%
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Compliance Score
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Report
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold">
                              {report.summary.totalEvents}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Total Events
                            </p>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-red-600">
                              {report.summary.criticalEvents}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Critical Events
                            </p>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">
                              {report.findings.length}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Findings
                            </p>
                          </div>
                        </div>

                        {report.findings.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Key Findings:</h4>
                            <div className="space-y-1">
                              {report.findings
                                .slice(0, 3)
                                .map((finding, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    <span>{finding.description}</span>
                                    <Badge
                                      variant="secondary"
                                      className="ml-auto"
                                    >
                                      {(finding as any).count || 0}
                                    </Badge>
                                  </div>
                                ))}
                              {report.findings.length > 3 && (
                                <p className="text-sm text-muted-foreground">
                                  +{report.findings.length - 3} more findings
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Standards Info Tab */}
        <TabsContent value="standards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {standards.map((standard) => (
              <Card key={standard.value}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {standard.label}
                  </CardTitle>
                  <CardDescription>{standard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Key Categories:</h4>
                      <div className="flex flex-wrap gap-2">
                        {standard.categories.map((category, index) => (
                          <Badge key={index} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
