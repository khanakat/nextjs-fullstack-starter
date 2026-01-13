"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  // Calendar,
  Clock,
  // Mail,
  Play,
  Pause,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  Search,
  // Filter,
  // Download,
  Users,
  FileText,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { fetchScheduledReportsWithRetry } from "@/lib/utils/api-retry";
// import { CreateScheduledReportDialog } from './create-scheduled-report-dialog';
// import { EditScheduledReportDialog } from './edit-scheduled-report-dialog';

interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  reportId: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  recipients: string[];
  format: "pdf" | "xlsx" | "csv";
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  report: {
    id: string;
    name: string;
    description?: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface ScheduledReportsListProps {
  organizationId: string;
  refreshTrigger?: number;
  onReportUpdated?: () => void;
  onReportDeleted?: () => void;
}

const ScheduledReportsListComponent = ({
  organizationId,
  refreshTrigger = 0,
  onReportUpdated,
  onReportDeleted,
}: ScheduledReportsListProps) => {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  // const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(
  //   null,
  // );
  // const [showCreateDialog, setShowCreateDialog] = useState(false);
  // const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const fetchScheduledReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      const result = await fetchScheduledReportsWithRetry(`/api/scheduled-reports?${params}`);
      
      if (!result.ok) {
        throw new Error(result.error || "Failed to fetch scheduled reports");
      }

      const data = result.data;
      setScheduledReports(data.scheduledReports || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching scheduled reports:", error);
      setScheduledReports([]);
      setTotalPages(1);
      toast({
        title: "Error - Could not load scheduled reports",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, statusFilter, toast]);

  // Create a stable refresh function
  const refreshData = useCallback(() => {
    setInternalRefreshTrigger(prev => prev + 1);
  }, []);

  // Separate useEffect for initial load and refresh triggers
  useEffect(() => {
    fetchScheduledReports();
  }, [fetchScheduledReports, refreshTrigger, internalRefreshTrigger]);

  const handleToggleStatus = async (
    reportId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: `Success - Report ${!currentStatus ? "activated" : "deactivated"} successfully`,
        type: "success",
      });

      refreshData();
      onReportUpdated?.();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error - Could not update report status",
        type: "error",
      });
    }
  };

  const handleExecuteNow = async (reportId: string) => {
    try {
      const response = await fetch(
        `/api/scheduled-reports/${reportId}/execute`,
        {
          method: "POST",
        },
      );

      if (!response.ok) throw new Error("Failed to execute report");

      toast({
        title: "Success - Report executed successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error executing report:", error);
      toast({
        title: "Error - Could not execute report",
        type: "error",
      });
    }
  };

  const handleDelete = async (reportId: string) => {
    if (
      !confirm("Are you sure you want to delete this scheduled report?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete report");

      toast({
        title: "Success - Scheduled report deleted successfully",
        type: "success",
      });

      refreshData();
      onReportDeleted?.();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error - Could not delete scheduled report",
        type: "error",
      });
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const getFormatBadgeColor = (format: string) => {
    const colors = {
      pdf: "bg-red-100 text-red-800",
      xlsx: "bg-green-100 text-green-800",
      csv: "bg-blue-100 text-blue-800",
    };
    return colors[format as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredReports = useMemo(() => {
    if (!scheduledReports || !Array.isArray(scheduledReports)) {
      return [];
    }
    
    return scheduledReports.filter(
      (report) =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.report.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [scheduledReports, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Scheduled Reports
          </h2>
          <p className="text-muted-foreground">
            Manage automated report generation
          </p>
        </div>
        <Button onClick={() => console.log("Create new report")}>
          <Plus className="h-4 w-4 mr-2" />
          New Scheduled Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select key="status-filter" value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select key="format-filter" value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports ({filteredReports.length})</CardTitle>
          <CardDescription>
            List of all scheduled reports for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No scheduled reports
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first scheduled report to automate report generation
              </p>
              <Button onClick={() => console.log("Create new report")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Scheduled Report
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base Report</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Execution</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        {report.description && (
                          <div className="text-sm text-gray-500">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{report.report.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {getFrequencyLabel(report.schedule.frequency)}
                        </span>
                        <span className="text-sm text-gray-500">
                          a las {report.schedule.time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.nextRun ? (
                        <div>
                          <div className="font-medium">
                            {format(
                              new Date(report.nextRun),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(report.nextRun), {
                              addSuffix: true,
                              locale: enUS,
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{report.recipients.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getFormatBadgeColor(report.format)}>
                        {report.format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={report.isActive ? "default" : "secondary"}
                      >
                        {report.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleExecuteNow(report.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Execute Now
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // setSelectedReport(report);
                              // setShowEditDialog(true);
                              console.log("Edit report", report);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(report.id, report.isActive)
                            }
                          >
                            {report.isActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(report.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Dialogs */}
      {/* Create Dialog */}
      {/* <CreateScheduledReportDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        organizationId={organizationId}
        onSuccess={() => {
          setShowCreateDialog(false);
          fetchScheduledReports();
        }}
      /> */}

      {/* Edit Dialog */}
      {/* <EditScheduledReportDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        scheduledReport={selectedReport}
        onSuccess={() => {
          setShowEditDialog(false);
          setSelectedReport(null);
          refreshData();
        }}
      /> */}
    </div>
  );
};

export const ScheduledReportsList = React.memo(ScheduledReportsListComponent);
