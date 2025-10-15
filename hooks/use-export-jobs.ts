'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ExportJob {
  id: string;
  reportId: string;
  reportTitle: string;
  format: 'pdf' | 'excel' | 'csv' | 'png';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  fileSize?: number;
  fileUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  scheduledFor?: string;
  isScheduled: boolean;
  userId: string;
}

export interface ExportJobFilters {
  status?: string;
  format?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExportJobsResponse {
  jobs: ExportJob[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useExportJobs(filters: ExportJobFilters = {}) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') searchParams.set('status', filters.status);
      if (filters.format && filters.format !== 'all') searchParams.set('format', filters.format);
      if (filters.search) searchParams.set('search', filters.search);
      if (filters.page) searchParams.set('page', filters.page.toString());
      if (filters.limit) searchParams.set('limit', filters.limit.toString());

      const response = await fetch(`/api/export-jobs?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch export jobs');
      }

      const data: ExportJobsResponse = await response.json();
      setJobs(data.jobs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters.status, filters.format, filters.search, filters.page, filters.limit]);

  const createExportJob = async (reportId: string, format: ExportJob['format'], scheduledFor?: string) => {
    try {
      const response = await fetch('/api/export-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          format,
          scheduledFor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create export job');
      }

      const newJob: ExportJob = await response.json();
      setJobs(prev => [newJob, ...prev]);
      toast.success('Export job created successfully');
      return newJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create export job';
      toast.error(errorMessage);
      throw err;
    }
  };

  const cancelJob = async (id: string) => {
    try {
      const response = await fetch(`/api/export-jobs/${id}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }

      const updatedJob: ExportJob = await response.json();
      setJobs(prev => prev.map(j => j.id === id ? updatedJob : j));
      toast.success('Export job cancelled');
      return updatedJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel job';
      toast.error(errorMessage);
      throw err;
    }
  };

  const retryJob = async (id: string) => {
    try {
      const response = await fetch(`/api/export-jobs/${id}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry job');
      }

      const updatedJob: ExportJob = await response.json();
      setJobs(prev => prev.map(j => j.id === id ? updatedJob : j));
      toast.success('Export job restarted');
      return updatedJob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry job';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const response = await fetch(`/api/export-jobs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success('Export job deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job';
      toast.error(errorMessage);
      throw err;
    }
  };

  const downloadJob = async (job: ExportJob) => {
    if (!job.fileUrl || job.status !== 'completed') {
      toast.error('File not available for download');
      return;
    }

    try {
      const response = await fetch(`/api/export-jobs/${job.id}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const downloadInfo = await response.json();
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadInfo.downloadUrl;
      link.download = downloadInfo.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${job.reportTitle}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      toast.error(errorMessage);
      throw err;
    }
  };

  const bulkDelete = async (jobIds: string[]) => {
    try {
      const response = await fetch('/api/export-jobs/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete jobs');
      }

      const result = await response.json();
      setJobs(prev => prev.filter(job => !jobIds.includes(job.id)));
      toast.success(`Deleted ${result.deletedCount} jobs`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete jobs';
      toast.error(errorMessage);
      throw err;
    }
  };

  const bulkDownload = async (jobIds: string[]) => {
    const completedJobs = jobs.filter(job => 
      jobIds.includes(job.id) && 
      job.status === 'completed' && 
      job.fileUrl
    );

    if (completedJobs.length === 0) {
      toast.error('No completed exports to download');
      return;
    }

    try {
      // Download each file individually
      for (const job of completedJobs) {
        await downloadJob(job);
      }
      
      toast.success(`Downloading ${completedJobs.length} files`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download files';
      toast.error(errorMessage);
      throw err;
    }
  };

  const clearCompleted = async () => {
    const completedJobIds = jobs
      .filter(job => job.status === 'completed')
      .map(job => job.id);

    if (completedJobIds.length === 0) {
      toast.error('No completed jobs to clear');
      return;
    }

    return bulkDelete(completedJobIds);
  };

  const refresh = () => {
    fetchJobs();
  };

  // Get job statistics
  const getStats = () => {
    const stats = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      cancelled: stats.cancelled || 0,
      total: jobs.length,
    };
  };

  return {
    jobs,
    loading,
    error,
    total,
    totalPages,
    createExportJob,
    cancelJob,
    retryJob,
    deleteJob,
    downloadJob,
    bulkDelete,
    bulkDownload,
    clearCompleted,
    refresh,
    stats: getStats(),
  };
}