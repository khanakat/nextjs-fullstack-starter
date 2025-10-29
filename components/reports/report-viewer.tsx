"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Share2,
  Edit,
  MoreHorizontal,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Table,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { ReportWithTemplate, ExportFormat } from "@/lib/types/reports";
import { formatDistanceToNow } from "date-fns";

interface ReportViewerProps {
  reportId: string;
}

export function ReportViewer({ reportId }: ReportViewerProps) {
  const router = useRouter();
  const [report, setReport] = useState<ReportWithTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const fetchReport = useCallback(async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/reports");
          return;
        }
        throw new Error("Failed to fetch report");
      }

      const data = await response.json();
      setReport(data);
    } catch (error) {
      toast.error("Failed to load report");
      console.error("Error fetching report:", error);
      router.push("/reports");
    } finally {
      setLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format: ExportFormat) => {
    try {
      const response = await fetch("/api/export-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          format,
          options: {
            dateRange,
            filterCategory:
              filterCategory !== "all" ? filterCategory : undefined,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create export job");

      toast.success(
        `${format} export started. Check the Export Center for progress.`,
      );
      router.push("/reports/exports");
    } catch (error) {
      toast.error("Failed to start export");
      console.error("Error creating export job:", error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Report link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!report) {
    return <div>Report not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.name}</h1>
            <p className="text-muted-foreground mt-1">
              {report.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(report.status)}>
            {report.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/reports/builder?edit=${reportId}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport(ExportFormat.PDF)}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport(ExportFormat.EXCEL)}
              >
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(ExportFormat.CSV)}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(ExportFormat.PNG)}>
                Export as PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/reports/builder?duplicate=${reportId}`)
                }
              >
                Duplicate Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/reports/settings?id=${reportId}`)}
              >
                Report Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Report Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Template:</span>
              <p className="font-medium">{report.template?.name || "Custom"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Views:</span>
              <p className="font-medium">0</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">
                {formatDistanceToNow(new Date(report.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <p className="font-medium">
                {formatDistanceToNow(new Date(report.updatedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Customize the data view with filters and date ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <DatePickerWithRange
                date={dateRange}
                onDateChange={(date) => setDateRange(date)}
                placeholder="Select date range"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Visualizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would appear here</p>
                <p className="text-sm">Connected to your data source</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-2" />
                <p>Pie chart visualization</p>
                <p className="text-sm">Real-time data updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <LineChart className="h-12 w-12 mx-auto mb-2" />
                <p>Line chart showing trends</p>
                <p className="text-sm">Historical data comparison</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Data Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Category</th>
                      <th className="text-left p-3 font-medium">Value</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">{new Date().toLocaleDateString()}</td>
                      <td className="p-3">Sales</td>
                      <td className="p-3">$1,000</td>
                      <td className="p-3">
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">{new Date().toLocaleDateString()}</td>
                      <td className="p-3">Marketing</td>
                      <td className="p-3">$750</td>
                      <td className="p-3">
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3">{new Date().toLocaleDateString()}</td>
                      <td className="p-3">Support</td>
                      <td className="p-3">$500</td>
                      <td className="p-3">
                        <Badge className="bg-gray-100 text-gray-800">
                          Inactive
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$2,250</div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">Growth Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
