"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  RefreshCw,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  Database,
  RotateCw,
  Activity,
  Eye,
} from "lucide-react";

interface SyncJob {
  id: string;
  integrationId: string;
  integrationName: string;
  provider: string;
  status: "running" | "completed" | "failed" | "paused" | "scheduled";
  progress: number;
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  totalRecords: number;
  errorCount: number;
  lastSyncTime?: Date;
  nextSyncTime?: Date;
  syncType: "full" | "incremental" | "manual";
  direction: "inbound" | "outbound" | "bidirectional";
  error?: string;
}

interface SyncStats {
  totalJobs: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  totalRecordsProcessed: number;
  averageDuration: number;
}

interface SyncDashboardProps {
  className?: string;
}

const SyncDashboard: React.FC<SyncDashboardProps> = ({ className = "" }) => {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [stats, setStats] = useState<SyncStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedToday: 0,
    failedToday: 0,
    totalRecordsProcessed: 0,
    averageDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");

  useEffect(() => {
    loadSyncData();
    const interval = setInterval(loadSyncData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSyncData = async () => {
    try {
      setLoading(true);
      const [jobsResponse, statsResponse] = await Promise.all([
        fetch("/api/integrations/sync/jobs"),
        fetch("/api/integrations/sync/stats"),
      ]);

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setSyncJobs(jobsData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to load sync data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "manual" }),
      });

      if (response.ok) {
        loadSyncData();
      }
    } catch (error) {
      console.error("Failed to start sync:", error);
    }
  };

  const handlePauseSync = async (jobId: string) => {
    try {
      const response = await fetch(
        `/api/integrations/sync/jobs/${jobId}/pause`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        loadSyncData();
      }
    } catch (error) {
      console.error("Failed to pause sync:", error);
    }
  };

  const handleStopSync = async (jobId: string) => {
    try {
      const response = await fetch(
        `/api/integrations/sync/jobs/${jobId}/stop`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        loadSyncData();
      }
    } catch (error) {
      console.error("Failed to stop sync:", error);
    }
  };

  const handleViewJob = (job: SyncJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      running: "default",
      completed: "default",
      failed: "destructive",
      paused: "secondary",
      scheduled: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  // Filter jobs
  const filteredJobs = syncJobs.filter((job) => {
    if (filterStatus !== "all" && job.status !== filterStatus) return false;
    if (filterProvider !== "all" && job.provider !== filterProvider)
      return false;
    return true;
  });

  // Get unique providers for filter
  const uniqueProviders = Array.from(
    new Set(syncJobs.map((job) => job.provider)),
  );

  return (
    <div className={className}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Jobs
                </p>
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
              </div>
              <Database className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Jobs
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.activeJobs}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed Today
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedToday}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Failed Today
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failedToday}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RotateCw className="w-5 h-5" />
              Sync Jobs
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {uniqueProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadSyncData}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading sync jobs...
                </span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sync jobs found.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {job.integrationName}
                          </span>
                          <Badge variant="outline">{job.provider}</Badge>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.syncType} sync • {job.direction}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === "running" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseSync(job.id)}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStopSync(job.id)}
                          >
                            <Square className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {(job.status === "completed" ||
                        job.status === "failed" ||
                        job.status === "paused") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartSync(job.integrationId)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewJob(job)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {job.status === "running" && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>
                          {job.recordsProcessed} / {job.totalRecords} records
                        </span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <div>{formatTimestamp(job.startTime)}</div>
                    </div>
                    {job.endTime && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div>{formatDuration(job.startTime, job.endTime)}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Records:</span>
                      <div>{job.recordsProcessed.toLocaleString()}</div>
                    </div>
                    {job.errorCount > 0 && (
                      <div>
                        <span className="text-muted-foreground">Errors:</span>
                        <div className="text-red-600">{job.errorCount}</div>
                      </div>
                    )}
                  </div>

                  {job.error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {job.error}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}
      <Dialog open={showJobDetail} onOpenChange={setShowJobDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedJob && getStatusIcon(selectedJob.status)}
              Sync Job Details
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Job Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Integration:</strong>{" "}
                        {selectedJob.integrationName}
                      </div>
                      <div>
                        <strong>Provider:</strong> {selectedJob.provider}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        {getStatusBadge(selectedJob.status)}
                      </div>
                      <div>
                        <strong>Type:</strong> {selectedJob.syncType}
                      </div>
                      <div>
                        <strong>Direction:</strong> {selectedJob.direction}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Timing</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Started:</strong>{" "}
                        {formatTimestamp(selectedJob.startTime)}
                      </div>
                      {selectedJob.endTime && (
                        <div>
                          <strong>Completed:</strong>{" "}
                          {formatTimestamp(selectedJob.endTime)}
                        </div>
                      )}
                      {selectedJob.lastSyncTime && (
                        <div>
                          <strong>Last Sync:</strong>{" "}
                          {formatTimestamp(selectedJob.lastSyncTime)}
                        </div>
                      )}
                      {selectedJob.nextSyncTime && (
                        <div>
                          <strong>Next Sync:</strong>{" "}
                          {formatTimestamp(selectedJob.nextSyncTime)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Progress</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Records Processed</span>
                        <span>
                          {selectedJob.recordsProcessed.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Total Records</span>
                        <span>{selectedJob.totalRecords.toLocaleString()}</span>
                      </div>
                      <Progress value={selectedJob.progress} className="h-2" />
                      <div className="text-center text-sm text-muted-foreground">
                        {selectedJob.progress.toFixed(1)}% complete
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Error Count:</strong> {selectedJob.errorCount}
                      </div>
                      <div>
                        <strong>Success Rate:</strong>{" "}
                        {selectedJob.recordsProcessed > 0
                          ? (
                              ((selectedJob.recordsProcessed -
                                selectedJob.errorCount) /
                                selectedJob.recordsProcessed) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </div>
                      {selectedJob.endTime && (
                        <div>
                          <strong>Duration:</strong>{" "}
                          {formatDuration(
                            selectedJob.startTime,
                            selectedJob.endTime,
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedJob.error && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">
                        Error Details
                      </h4>
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                        {selectedJob.error}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SyncDashboard;
