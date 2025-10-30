/**
 * Export Queue Worker
 * Processes export jobs from the queue
 */

import { Job } from 'bullmq';
import { JobTypes } from '../config';
import { QueueJobData } from '../queue-manager';
import { pdfService } from '../../pdf/pdf-service';
import { emailService } from '../../email/email-service';
import { EmailTemplates } from '../../email/templates';
import { db as prisma } from "../../db";
import { ErrorHandler, FileError, DatabaseError, ErrorPatterns } from "@/lib/error-handling";

export interface ExportJobPayload {
  exportType: 'pdf' | 'csv' | 'excel';
  reportType: string;
  filters?: Record<string, any>;
  options?: {
    includeCharts?: boolean;
    includeImages?: boolean;
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
  };
  notifyEmail?: string;
  fileName?: string;
}

export interface ScheduledReportJobPayload {
  scheduledReportId: string;
  runId: string;
}

/**
 * Process export jobs
 */
export async function processExportJob(job: Job<QueueJobData>): Promise<any> {
  const { type, payload, userId, organizationId } = job.data;

  const context = {
    operation: 'processExportJob',
    metadata: {
      jobId: job.id,
      type,
      userId,
      organizationId,
    },
  };

  console.log(`[ExportWorker] Processing job ${job.id} of type ${type}`);

  const result = await ErrorHandler.safeExecute(
    async () => {
      switch (type) {
        case JobTypes.EXPORT_DATA:
          return await processDataExport(payload as ExportJobPayload, job, userId, organizationId);

        case JobTypes.GENERATE_REPORT:
          return await processReportGeneration(payload as ExportJobPayload, job, userId, organizationId);

        case JobTypes.SCHEDULED_REPORT:
          return await processScheduledReport(payload as ScheduledReportJobPayload, job);

        default:
          throw new Error(`Unknown export job type: ${type}`);
      }
    },
    context,
    ErrorPatterns.backgroundJob
  );

  if (result.success) {
    return result.data;
  } else {
    console.error(`[ExportWorker] Job ${job.id} failed:`, result.error);
    
    // Update export job status in database if applicable
    if (type === JobTypes.SCHEDULED_REPORT) {
      const { runId } = payload as ScheduledReportJobPayload;
      await updateScheduledReportRun(runId, 'failed', result.error instanceof Error ? result.error.message : 'Unknown error');
    }
    
    throw result.error || new Error('Export job failed');
  }
}

/**
 * Process data export
 */
async function processDataExport(
  payload: ExportJobPayload, 
  job: Job, 
  userId?: string, 
  organizationId?: string
): Promise<any> {
  const { exportType, reportType, filters, options, notifyEmail, fileName } = payload;

  console.log(`[ExportWorker] Processing data export:`, {
    exportType,
    reportType,
    userId,
    organizationId,
  });

  // Update progress
  await job.updateProgress(10);

  // Fetch data based on report type and filters
  const data = await fetchReportData(reportType, filters, userId, organizationId);
  await job.updateProgress(30);

  let result: any;
  let filePath: string;

  switch (exportType) {
    case 'pdf':
      result = await pdfService.generateCustom({
        title: `${reportType} Report`,
        data,
        templateName: getTemplateForReportType(reportType),
        options: {
          options: {
            format: options?.format || 'A4',
            orientation: options?.orientation || 'portrait',
            includeCharts: options?.includeCharts || false,
            includeImages: options?.includeImages || false,
          },
        },
        fileName: fileName || `${reportType}-${Date.now()}.pdf`,
      });
      filePath = result.filePath || '';
      break;

    case 'csv':
      result = await generateCSV(data, fileName || `${reportType}-${Date.now()}.csv`);
      filePath = result.filePath;
      break;

    case 'excel':
      result = await generateExcel(data, fileName || `${reportType}-${Date.now()}.xlsx`);
      filePath = result.filePath;
      break;

    default:
      throw new Error(`Unsupported export type: ${exportType}`);
  }

  await job.updateProgress(80);

  // Send notification email if requested
  if (notifyEmail && userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      await EmailTemplates.sendReportNotificationEmail(emailService, {
        firstName: user?.name || 'User',
        email: notifyEmail,
        reportName: `${reportType} Report`,
        reportType: reportType,
        downloadUrl: result.downloadUrl || filePath,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        reportDescription: `Your ${reportType} report has been generated successfully.`,
        fileSize: result.fileSize || 'Unknown',
      });

      console.log(`[ExportWorker] Notification email sent to ${notifyEmail}`);
    } catch (emailError) {
      console.error(`[ExportWorker] Failed to send notification email:`, emailError);
      // Don't fail the job if email fails
    }
  }

  await job.updateProgress(100);

  console.log(`[ExportWorker] Data export completed:`, {
    jobId: job.id,
    exportType,
    reportType,
    filePath,
    fileSize: result.fileSize,
  });

  return {
    success: true,
    exportType,
    reportType,
    filePath,
    downloadUrl: result.downloadUrl,
    fileSize: result.fileSize,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process report generation
 */
async function processReportGeneration(
  payload: ExportJobPayload, 
  job: Job, 
  userId?: string, 
  organizationId?: string
): Promise<any> {
  // Similar to data export but with more advanced report features
  return await processDataExport(payload, job, userId, organizationId);
}

/**
 * Process scheduled report
 */
async function processScheduledReport(payload: ScheduledReportJobPayload, job: Job): Promise<any> {
  const { scheduledReportId, runId } = payload;

  console.log(`[ExportWorker] Processing scheduled report:`, {
    scheduledReportId,
    runId,
  });

  // Update run status to running
  await updateScheduledReportRun(runId, 'running');
  await job.updateProgress(10);

  try {
    // Get scheduled report details
    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id: scheduledReportId },
      include: {
        report: {
          select: { id: true, name: true, config: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!scheduledReport) {
      throw new Error(`Scheduled report not found: ${scheduledReportId}`);
    }

    // Get user details separately
    const user = await prisma.user.findUnique({
      where: { id: scheduledReport.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new Error(`User not found: ${scheduledReport.userId}`);
    }

    await job.updateProgress(20);

    // Generate the report
    const exportPayload: ExportJobPayload = {
      exportType: scheduledReport.format as 'pdf' | 'csv' | 'excel',
      reportType: scheduledReport.report?.name || 'scheduled-report',
      filters: {}, // Default empty filters for scheduled reports
      options: JSON.parse(scheduledReport.options || '{}'),
      notifyEmail: user.email,
      fileName: `${scheduledReport.name}-${new Date().toISOString().split('T')[0]}`,
    };

    const result = await processDataExport(
      exportPayload,
      job,
      user.id,
      scheduledReport.organization?.id
    );

    await job.updateProgress(90);

    // Update run status to completed
    await updateScheduledReportRun(runId, 'completed', undefined, {
      filePath: result.filePath,
      fileSize: result.fileSize,
      downloadUrl: result.downloadUrl,
    });

    await job.updateProgress(100);

    console.log(`[ExportWorker] Scheduled report completed:`, {
      jobId: job.id,
      scheduledReportId,
      runId,
      result,
    });

    return {
      success: true,
      scheduledReportId,
      runId,
      result,
    };

  } catch (error) {
    await updateScheduledReportRun(runId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Fetch report data based on type and filters
 */
async function fetchReportData(
  reportType: string,
  filters?: Record<string, any>,
  userId?: string,
  organizationId?: string
): Promise<any[]> {
  // This is a placeholder - implement actual data fetching logic
  // based on your specific report types and data models
  
  console.log(`[ExportWorker] Fetching data for report type: ${reportType}`);

  switch (reportType) {
    case 'users':
      return await fetchUsersData(filters, organizationId);
    
    case 'analytics':
      return await fetchAnalyticsData(filters, organizationId);
    
    case 'exports':
      return await fetchExportsData(filters, userId, organizationId);
    
    default:
      // Return sample data for unknown report types
      return [
        { id: 1, name: 'Sample Data 1', value: 100, date: new Date().toISOString() },
        { id: 2, name: 'Sample Data 2', value: 200, date: new Date().toISOString() },
        { id: 3, name: 'Sample Data 3', value: 300, date: new Date().toISOString() },
      ];
  }
}

/**
 * Fetch users data
 */
async function fetchUsersData(filters?: Record<string, any>, organizationId?: string): Promise<any[]> {
  const where: any = {};
  
  if (organizationId) {
    where.organizationId = organizationId;
  }
  
  if (filters?.dateFrom) {
    where.createdAt = { gte: new Date(filters.dateFrom) };
  }
  
  if (filters?.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
}

/**
 * Fetch analytics data
 */
async function fetchAnalyticsData(filters?: Record<string, any>, organizationId?: string): Promise<any[]> {
  // Placeholder for analytics data
  return [
    { metric: 'Total Users', value: 1250, change: '+12%', date: new Date().toISOString() },
    { metric: 'Active Sessions', value: 89, change: '+5%', date: new Date().toISOString() },
    { metric: 'Reports Generated', value: 45, change: '+23%', date: new Date().toISOString() },
  ];
}

/**
 * Fetch exports data
 */
async function fetchExportsData(filters?: Record<string, any>, userId?: string, organizationId?: string): Promise<any[]> {
  const where: any = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const exports = await prisma.exportJob.findMany({
    where,
    select: {
      id: true,
      format: true,
      status: true,
      filename: true,
      fileSize: true,
      createdAt: true,
      completedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return exports;
}

/**
 * Generate CSV file
 */
async function generateCSV(data: any[], fileName: string): Promise<any> {
  // Placeholder CSV generation
  const csv = convertToCSV(data);
  const filePath = `/tmp/${fileName}`;
  
  // In a real implementation, you would write to file system
  console.log(`[ExportWorker] Generated CSV: ${filePath}`);
  
  return {
    filePath,
    fileSize: csv.length,
    downloadUrl: `/api/downloads/${fileName}`,
  };
}

/**
 * Generate Excel file
 */
async function generateExcel(data: any[], fileName: string): Promise<any> {
  // Placeholder Excel generation
  // You would use a library like 'xlsx' or 'exceljs' here
  const filePath = `/tmp/${fileName}`;
  
  console.log(`[ExportWorker] Generated Excel: ${filePath}`);
  
  return {
    filePath,
    fileSize: data.length * 100, // Estimated size
    downloadUrl: `/api/downloads/${fileName}`,
  };
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Get template name for report type
 */
function getTemplateForReportType(reportType: string): string | undefined {
  const templateMap: Record<string, string> = {
    'users': 'user-report',
    'analytics': 'analytics-report',
    'exports': 'export-summary',
    'financial': 'financial-report',
    'system': 'system-health',
  };
  
  return templateMap[reportType.toLowerCase()];
}

/**
 * Update scheduled report run status
 */
async function updateScheduledReportRun(
  runId: string,
  status: 'running' | 'completed' | 'failed',
  error?: string,
  result?: any
): Promise<void> {
  try {
    await prisma.scheduledReportRun.update({
      where: { id: runId },
      data: {
        status,
        errorMessage: error,
        errorDetails: result ? JSON.stringify(result) : undefined,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
      },
    });
  } catch (dbError) {
    console.error(`[ExportWorker] Failed to update run status:`, dbError);
  }
}