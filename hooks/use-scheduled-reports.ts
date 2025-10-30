"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchScheduledReportsWithRetry } from "@/lib/utils/api-retry";
import type {
  ScheduledReportConfig as ScheduledReport,
  ScheduledReportRun as ExecutionHistory,
  ScheduledReportStats as StatsData,
  CreateScheduledReportRequest as CreateScheduledReportData,
  UpdateScheduledReportRequest as UpdateScheduledReportData,
  PaginatedScheduledReports,
  PaginatedScheduledReportRuns,
} from "@/lib/types/scheduled-reports";

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  format?: string;
}

// Simple cache for demo data to reduce API calls
const demoCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

function getCachedData(key: string) {
  const cached = demoCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  demoCache.set(key, { data, timestamp: Date.now() });
}



export function useScheduledReports(organizationId: string) {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [history, setHistory] = useState<ExecutionHistory[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  const { toast } = useToast();

  // Enhanced error handling with better rate limit messages
  const handleApiError = useCallback((error: any, operation: string) => {
    console.error(`${operation} error:`, error);
    
    let errorMessage = `Failed to ${operation.toLowerCase()}`;
    let shouldShowToast = true;
    
    // Handle rate limiting errors with better messages
    if (error?.status === 429 || error?.message?.includes("Too Many Requests")) {
      errorMessage = "Too many requests. The system is temporarily limiting requests to ensure stability. Please wait a moment and try again.";
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    
    // For rate limiting, don't show error state but do show toast
    if (error?.status !== 429) {
      setError(errorMessage);
    }
    
    if (shouldShowToast) {
      toast({
        title: error?.status === 429 ? "Rate Limited" : `${operation} Failed`,
        message: errorMessage,
        type: error?.status === 429 ? "warning" : "error",
      });
    }
    
    return errorMessage;
  }, [toast]);

  // Fetch scheduled reports with enhanced error handling
  const fetchReports = useCallback(async (params: PaginationParams = {}) => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        organizationId,
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status }),
        ...(params.format && { format: params.format }),
      });
      
      const result = await fetchScheduledReportsWithRetry(`/api/scheduled-reports?${queryParams}`);
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch reports');
      }
      
      const data: PaginatedScheduledReports = result.data;
      
      setReports(data.scheduledReports);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
        hasNext: data.page < data.totalPages,
        hasPrev: data.page > 1,
      });
    } catch (err) {
      handleApiError(err, "Fetch Reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, handleApiError]);

  // Fetch execution history with enhanced error handling
  const fetchHistory = useCallback(async (params: PaginationParams = {}) => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        organizationId,
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status }),
      });
      
      const result = await fetchScheduledReportsWithRetry(`/api/scheduled-reports/history?${queryParams}`);
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch history');
      }
      
      const data: PaginatedScheduledReportRuns = result.data;
      
      setHistory(data.runs);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
        hasNext: data.page < data.totalPages,
        hasPrev: data.page > 1,
      });
    } catch (err) {
      handleApiError(err, "Fetch History");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, handleApiError]);

  // Fetch statistics with enhanced error handling and caching
  const fetchStats = useCallback(async () => {
    if (!organizationId) return;
    
    // Check cache for demo data
    const isDemo = organizationId === "demo-org";
    const cacheKey = `stats-${organizationId}`;
    
    if (isDemo) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setStats(cachedData);
        return;
      }
    }
    
    try {
      const result = await fetchScheduledReportsWithRetry(`/api/scheduled-reports/stats?organizationId=${organizationId}`);
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }
      
      const data: StatsData = result.data;
      setStats(data);
      
      // Cache demo data
      if (isDemo) {
        setCachedData(cacheKey, data);
      }
    } catch (err) {
      handleApiError(err, "Fetch Statistics");
      setStats(null);
    }
  }, [organizationId, handleApiError]);

  // Create scheduled report with enhanced error handling
  const createReport = useCallback(async (data: CreateScheduledReportData): Promise<ScheduledReport | null> => {
    if (!organizationId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/scheduled-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          organizationId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const newReport: ScheduledReport = await response.json();
      
      // Update local state
      setReports(prev => [newReport, ...prev]);
      
      toast({
        title: "Success",
        message: "Scheduled report created successfully",
        type: "success",
      });
      
      return newReport;
    } catch (err) {
      handleApiError(err, "Create Report");
      return null;
    } finally {
      setLoading(false);
    }
  }, [organizationId, handleApiError, toast]);

  // Update scheduled report with enhanced error handling
  const updateReport = useCallback(async (id: string, data: UpdateScheduledReportData): Promise<ScheduledReport | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/scheduled-reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const updatedReport: ScheduledReport = await response.json();
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === id ? updatedReport : report
      ));
      
      toast({
        title: "Success",
        message: "Scheduled report updated successfully",
        type: "success",
      });
      
      return updatedReport;
    } catch (err) {
      handleApiError(err, "Update Report");
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleApiError, toast]);

  // Delete scheduled report with enhanced error handling
  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/scheduled-reports/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Update local state
      setReports(prev => prev.filter(report => report.id !== id));
      
      toast({
        title: "Success",
        message: "Scheduled report deleted successfully",
        type: "success",
      });
      
      return true;
    } catch (err) {
      handleApiError(err, "Delete Report");
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleApiError, toast]);

  // Execute scheduled report immediately with enhanced error handling
  const executeReport = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/scheduled-reports/${id}/execute`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        message: "Report execution started successfully",
        type: "success",
      });
      
      return true;
    } catch (err) {
      handleApiError(err, "Execute Report");
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleApiError, toast]);

  // Toggle report active status with enhanced error handling
  const toggleReportStatus = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/scheduled-reports/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const updatedReport: ScheduledReport = await response.json();
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === id ? updatedReport : report
      ));
      
      toast({
        title: "Success",
        message: `Report ${isActive ? "activated" : "deactivated"} successfully`,
        type: "success",
      });
      
      return true;
    } catch (err) {
      handleApiError(err, "Toggle Report Status");
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleApiError, toast]);

  // Download report file with enhanced error handling
  const downloadReport = useCallback(async (executionId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/scheduled-reports/download/${executionId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get filename from response headers
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `report-${executionId}.pdf`;
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        message: "Report downloaded successfully",
        type: "success",
      });
      
      return true;
    } catch (err) {
      handleApiError(err, "Download Report");
      return false;
    }
  }, [handleApiError, toast]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!organizationId) return;
    
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // Refresh stats every 30 seconds
    
    return () => clearInterval(interval);
  }, [organizationId, fetchStats]);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 10000); // Clear error after 10 seconds
      
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [error]);

  return {
    // Data
    reports,
    history,
    stats,
    pagination,
    
    // State
    loading,
    error,
    
    // Actions
    fetchReports,
    fetchHistory,
    fetchStats,
    createReport,
    updateReport,
    deleteReport,
    executeReport,
    toggleReportStatus,
    downloadReport,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => {
      fetchReports();
      fetchHistory();
      fetchStats();
    },
  };
}

export type {
  ScheduledReport,
  ExecutionHistory,
  StatsData,
  CreateScheduledReportData,
  UpdateScheduledReportData,
  ApiError,
  PaginationParams,
};