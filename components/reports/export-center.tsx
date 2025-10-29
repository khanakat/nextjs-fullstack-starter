"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import { Progress } from "@/components/ui/progress";
import {
  Download,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Search,
  MoreHorizontal,
  Square,
  FileSpreadsheet,
  Image,
  Archive,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface ExportJob {
  id: string;
  reportId: string;
  reportTitle: string;
  format: "pdf" | "excel" | "csv" | "png";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  fileSize?: number;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  scheduledFor?: string;
  isScheduled: boolean;
  userId: string;
}

interface ExportCenterProps {
  userId: string;
  initialStatus?: string;
  initialFormat?: string;
  initialDate?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800",
    icon: RefreshCw,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    icon: Square,
  },
};

const FORMAT_CONFIG = {
  pdf: { label: "PDF", icon: FileText, color: "text-red-600" },
  excel: { label: "Excel", icon: FileSpreadsheet, color: "text-green-600" },
  csv: { label: "CSV", icon: FileText, color: "text-blue-600" },
  png: { label: "PNG", icon: Image, color: "text-purple-600" },
};

function ExportJobCard({
  job,
  onDownload,
  onCancel,
  onRetry,
  onDelete,
}: {
  job: ExportJob;
  onDownload: (job: ExportJob) => void;
  onCancel: (job: ExportJob) => void;
  onRetry: (job: ExportJob) => void;
  onDelete: (job: ExportJob) => void;
}) {
  const statusConfig = STATUS_CONFIG[job.status];
  const formatConfig = FORMAT_CONFIG[job.format];
  const StatusIcon = statusConfig.icon;
  const FormatIcon = formatConfig.icon;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                formatConfig.color
                  .replace("text-", "bg-")
                  .replace("-600", "-50"),
              )}
            >
              <FormatIcon className={cn("h-4 w-4", formatConfig.color)} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold line-clamp-1">
                {job.reportTitle}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusConfig.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatConfig.label}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {job.status === "completed" && job.downloadUrl && (
                <DropdownMenuItem onClick={() => onDownload(job)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              {(job.status === "pending" || job.status === "processing") && (
                <DropdownMenuItem onClick={() => onCancel(job)}>
                  <Square className="h-4 w-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}
              {job.status === "failed" && (
                <DropdownMenuItem onClick={() => onRetry(job)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(job)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Bar for Processing Jobs */}
          {job.status === "processing" && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
            </div>
          )}

          {/* Error Message */}
          {job.status === "failed" && job.errorMessage && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              {job.errorMessage}
            </div>
          )}

          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <div className="font-medium">{formatDate(job.createdAt)}</div>
            </div>

            {job.completedAt && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <div className="font-medium">{formatDate(job.completedAt)}</div>
              </div>
            )}

            {job.fileSize && (
              <div>
                <span className="text-muted-foreground">File Size:</span>
                <div className="font-medium">
                  {formatFileSize(job.fileSize)}
                </div>
              </div>
            )}

            {job.expiresAt && job.status === "completed" && (
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <div className="font-medium text-orange-600">
                  {getTimeRemaining(job.expiresAt)}
                </div>
              </div>
            )}
          </div>

          {/* Scheduled Job Info */}
          {job.isScheduled && job.scheduledFor && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <Calendar className="h-4 w-4 inline mr-1 text-blue-600" />
              <span className="text-blue-700">
                Scheduled for: {formatDate(job.scheduledFor)}
              </span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {job.status === "completed" && job.downloadUrl ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onDownload(job)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download {formatConfig.label}
              </Button>
            ) : job.status === "failed" ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onRetry(job)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Export
              </Button>
            ) : job.status === "processing" || job.status === "pending" ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onCancel(job)}
              >
                <Square className="h-4 w-4 mr-2" />
                Cancel Export
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExportCenter({
  userId,
  initialStatus,
  initialFormat,
}: ExportCenterProps) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all");
  const [formatFilter, setFormatFilter] = useState(initialFormat || "all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for demonstration
  useEffect(() => {
    const mockJobs: ExportJob[] = [
      {
        id: "1",
        reportId: "report-1",
        reportTitle: "Monthly Sales Dashboard",
        format: "pdf",
        status: "completed",
        progress: 100,
        fileSize: 2048576, // 2MB
        downloadUrl: "/api/exports/1/download",
        createdAt: "2024-01-21T10:30:00Z",
        completedAt: "2024-01-21T10:32:00Z",
        expiresAt: "2024-01-28T10:32:00Z",
        isScheduled: false,
        userId,
      },
      {
        id: "2",
        reportId: "report-2",
        reportTitle: "Financial Summary Report",
        format: "excel",
        status: "processing",
        progress: 65,
        createdAt: "2024-01-21T11:00:00Z",
        isScheduled: false,
        userId,
      },
      {
        id: "3",
        reportId: "report-3",
        reportTitle: "Operational Efficiency Tracker",
        format: "csv",
        status: "failed",
        progress: 0,
        errorMessage: "Data source connection timeout",
        createdAt: "2024-01-21T09:45:00Z",
        isScheduled: false,
        userId,
      },
      {
        id: "4",
        reportId: "report-4",
        reportTitle: "Marketing Campaign Analysis",
        format: "png",
        status: "pending",
        progress: 0,
        createdAt: "2024-01-21T11:15:00Z",
        scheduledFor: "2024-01-21T12:00:00Z",
        isScheduled: true,
        userId,
      },
      {
        id: "5",
        reportId: "report-5",
        reportTitle: "Weekly Performance Report",
        format: "pdf",
        status: "completed",
        progress: 100,
        fileSize: 1536000, // 1.5MB
        downloadUrl: "/api/exports/5/download",
        createdAt: "2024-01-20T16:20:00Z",
        completedAt: "2024-01-20T16:22:00Z",
        expiresAt: "2024-01-27T16:22:00Z",
        isScheduled: false,
        userId,
      },
    ];

    setJobs(mockJobs);
    setLoading(false);
  }, [userId]);

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesFormat = formatFilter === "all" || job.format === formatFilter;
    const matchesSearch =
      !searchQuery ||
      job.reportTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesFormat && matchesSearch;
  });

  // Group jobs by status for stats
  const jobStats = jobs.reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Handle job actions
  const handleDownload = async (job: ExportJob) => {
    if (!job.downloadUrl) return;

    try {
      // In a real app, this would trigger the download
      window.open(job.downloadUrl, "_blank");
      toast.success(`Downloading ${job.reportTitle}`);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleCancel = async (job: ExportJob) => {
    try {
      const response = await fetch(`/api/export-jobs/${job.id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel job");

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id ? { ...j, status: "cancelled" as const } : j,
        ),
      );

      toast.success("Export job cancelled");
    } catch (error) {
      toast.error("Failed to cancel job");
    }
  };

  const handleRetry = async (job: ExportJob) => {
    try {
      const response = await fetch(`/api/export-jobs/${job.id}/retry`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to retry job");

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: "pending" as const,
                progress: 0,
                errorMessage: undefined,
              }
            : j,
        ),
      );

      toast.success("Export job restarted");
    } catch (error) {
      toast.error("Failed to retry job");
    }
  };

  const handleDelete = async (job: ExportJob) => {
    try {
      const response = await fetch(`/api/export-jobs/${job.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete job");

      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success("Export job deleted");
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  const handleBulkDownload = () => {
    const completedJobs = filteredJobs.filter(
      (job) => job.status === "completed" && job.downloadUrl,
    );

    if (completedJobs.length === 0) {
      toast.error("No completed exports to download");
      return;
    }

    completedJobs.forEach((job) => handleDownload(job));
    toast.success(`Downloading ${completedJobs.length} files`);
  };

  const handleClearCompleted = async () => {
    const completedJobIds = jobs
      .filter((job) => job.status === "completed")
      .map((job) => job.id);

    if (completedJobIds.length === 0) {
      toast.error("No completed jobs to clear");
      return;
    }

    try {
      const response = await fetch("/api/export-jobs/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: completedJobIds }),
      });

      if (!response.ok) throw new Error("Failed to clear completed jobs");

      setJobs((prev) =>
        prev.filter((job) => !completedJobIds.includes(job.id)),
      );
      toast.success(`Cleared ${completedJobIds.length} completed jobs`);
    } catch (error) {
      toast.error("Failed to clear completed jobs");
    }
  };

  if (loading) {
    return <div>Loading export jobs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = jobStats[status] || 0;
          const Icon = config.icon;

          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      config.color
                        .replace("text-", "bg-")
                        .replace("-800", "-100"),
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        config.color
                          .replace("bg-", "text-")
                          .replace("-100", "-600"),
                      )}
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">
                      {config.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              {Object.entries(FORMAT_CONFIG).map(([format, config]) => (
                <SelectItem key={format} value={format}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBulkDownload}>
            <Archive className="h-4 w-4 mr-2" />
            Bulk Download
          </Button>
          <Button variant="outline" onClick={handleClearCompleted}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Completed
          </Button>
        </div>
      </div>

      {/* Export Jobs */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          {filteredJobs.length === 0 ? (
            <EmptyState
              icon={<Download className="h-12 w-12" />}
              title="No export jobs found"
              subtitle={
                searchQuery
                  ? `No exports match "${searchQuery}". Try adjusting your search terms.`
                  : "You haven't created any export jobs yet. Start by exporting a report."
              }
              action={
                <Button onClick={() => (window.location.href = "/reports")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Go to Reports
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <ExportJobCard
                  key={job.id}
                  job={job}
                  onDownload={handleDownload}
                  onCancel={handleCancel}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {/* List view would use DataTable component */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                List view implementation would go here using the DataTable
                component
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
