import { db } from "@/lib/db";
import { QueueHelpers } from "@/lib/queue";
import { emailService } from "@/lib/email/email-service";
import { pdfService } from "@/lib/pdf/pdf-service";
import { ErrorHandler, DatabaseError, ValidationError } from "@/lib/error-handling";
import { logger } from "@/lib/logger";
import * as cron from "node-cron";
import { 
  ScheduledReportConfig,
  ScheduledReportRun,
  CreateScheduledReportRequest,
  UpdateScheduledReportRequest,
  ScheduledReportFilters,
  ScheduledReportRunFilters,
  PaginatedScheduledReports,
  PaginatedScheduledReportRuns,
  ScheduledReportJobPayload,
  ScheduledReportExecutionResult,
  CronScheduleInfo,
  ScheduledReportEmailData,
  ScheduledReportError,
  CronValidationError,
  ReportAccessError,
  ScheduledReportNotFoundError,
  ScheduledReportRunStatus,
  ScheduledReportStats
} from "@/lib/types/scheduled-reports";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate cron expression
 */
function validateCronExpression(expression: string): boolean {
  try {
    return cron.validate(expression);
  } catch (error) {
    return false;
  }
}

/**
 * Calculate next run time from cron expression
 */
function calculateNextRun(cronExpression: string, timezone: string = 'UTC'): Date {
  try {
    const now = new Date();
    
    // Simple cron parsing for common patterns
    const cronParts = cronExpression.split(' ');
    if (cronParts.length !== 5) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours
    }
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;
    
    // For daily reports (0 9 * * *) - 9 AM daily
    if (minute === '0' && hour === '9' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const nextRun = new Date(now);
      nextRun.setHours(9, 0, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      return nextRun;
    }
    
    // For weekly reports (0 9 * * 1) - 9 AM every Monday
    if (minute === '0' && hour === '9' && dayOfMonth === '*' && month === '*' && dayOfWeek === '1') {
      const nextRun = new Date(now);
      nextRun.setHours(9, 0, 0, 0);
      const daysUntilMonday = (1 + 7 - nextRun.getDay()) % 7;
      if (daysUntilMonday === 0 && nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setDate(nextRun.getDate() + daysUntilMonday);
      }
      return nextRun;
    }
    
    // Default: add 1 hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  } catch (error) {
    logger.error('Failed to calculate next run time', 'scheduled-reports', { cronExpression, error });
    // Fallback to 24 hours from now
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Convert database model to ScheduledReportConfig
 */
function mapToScheduledReportConfig(dbRecord: any): ScheduledReportConfig {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description,
    reportId: dbRecord.reportId,
    userId: dbRecord.userId,
    organizationId: dbRecord.organizationId,
    schedule: dbRecord.schedule,
    timezone: dbRecord.timezone || 'UTC',
    recipients: Array.isArray(dbRecord.recipients) ? dbRecord.recipients : JSON.parse(dbRecord.recipients || '[]'),
    format: dbRecord.format,
    options: typeof dbRecord.options === 'object' ? dbRecord.options : JSON.parse(dbRecord.options || '{}'),
    isActive: dbRecord.isActive,
    lastRun: dbRecord.lastRun,
    nextRun: dbRecord.nextRun,
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
}

/**
 * Convert database model to ScheduledReportRun
 */
function mapToScheduledReportRun(dbRecord: any): ScheduledReportRun {
  return {
    id: dbRecord.id,
    scheduledReportId: dbRecord.scheduledReportId,
    status: dbRecord.status,
    startedAt: dbRecord.startedAt,
    completedAt: dbRecord.completedAt,
    duration: dbRecord.duration,
    totalRecipients: dbRecord.totalRecipients,
    successfulSends: dbRecord.successfulSends,
    failedSends: dbRecord.failedSends,
    exportJobId: dbRecord.exportJobId,
    downloadUrl: dbRecord.downloadUrl,
    fileSize: dbRecord.fileSize,
    errorMessage: dbRecord.errorMessage,
    errorDetails: dbRecord.errorDetails,
    createdAt: dbRecord.createdAt,
  };
}

// ============================================================================
// SCHEDULED REPORTS SERVICE
// ============================================================================

export class ScheduledReportsService {
  /**
   * Create a new scheduled report
   */
  static async createScheduledReport(
    userId: string,
    request: CreateScheduledReportRequest,
  ): Promise<ScheduledReportConfig> {
    try {
      // Validate cron expression
      if (!validateCronExpression(request.schedule)) {
        throw new CronValidationError(request.schedule);
      }

      // Verify report exists and user has access
      const report = await db.report.findFirst({
        where: {
          id: request.reportId,
          OR: [
            { createdBy: userId },
            { organizationId: request.organizationId }
          ]
        }
      });

      if (!report) {
        throw new ReportAccessError(request.reportId, userId);
      }

      // Calculate next run time
      const nextRun = calculateNextRun(request.schedule, request.timezone);

      // Create scheduled report
      const scheduledReport = await db.scheduledReport.create({
        data: {
          name: request.name,
          description: request.description,
          reportId: request.reportId,
          userId: userId,
          organizationId: request.organizationId,
          schedule: request.schedule,
          timezone: request.timezone || 'UTC',
          recipients: JSON.stringify(request.recipients),
          format: request.format,
          options: JSON.stringify(request.options || {}),
          isActive: request.isActive ?? true,
          nextRun,
        },
      });

      // Schedule the job if active
      if (scheduledReport.isActive) {
        await this.scheduleReportJob(scheduledReport.id, nextRun);
      }

      logger.info('Scheduled report created', 'scheduled-reports', {
        scheduledReportId: scheduledReport.id,
        reportId: request.reportId,
        userId,
        organizationId: request.organizationId
      });

      return mapToScheduledReportConfig(scheduledReport);
    } catch (error) {
      if (error instanceof ScheduledReportError) {
        throw error;
      }
      
      logger.error('Failed to create scheduled report', 'scheduled-reports', { error, userId, request });
      throw new DatabaseError('Failed to create scheduled report', { 
        userId, 
        operation: 'CREATE_SCHEDULED_REPORT', 
        metadata: { originalError: error, request } 
      });
    }
  }

  /**
   * Get scheduled reports with filtering and pagination
   */
  static async getScheduledReports(
    userId: string,
    filters: ScheduledReportFilters = {},
  ): Promise<PaginatedScheduledReports> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100); // Cap at 100
      const skip = (page - 1) * limit;

      // Build where clause using AND for userId and organizationId
      const where: any = {
        userId: userId,
      };

      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.reportId) {
        where.reportId = filters.reportId;
      }

      if (filters.format) {
        where.format = filters.format;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Get scheduled reports with relations
      const [scheduledReports, total] = await Promise.all([
        db.scheduledReport.findMany({
          where,
          include: {
            report: {
              select: { id: true, name: true, description: true }
            },
            organization: {
              select: { id: true, name: true }
            },
            _count: {
              select: { runs: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.scheduledReport.count({ where })
      ]);

      const mappedReports = scheduledReports.map(mapToScheduledReportConfig);

      return {
        scheduledReports: mappedReports,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get scheduled reports', 'scheduled-reports', { error, userId, filters });
      throw new DatabaseError('Failed to get scheduled reports', { 
        userId, 
        operation: 'GET_SCHEDULED_REPORTS', 
        metadata: { originalError: error, filters } 
      });
    }
  }

  /**
   * Get a single scheduled report by ID
   */
  static async getScheduledReportById(
    scheduledReportId: string,
    userId: string,
  ): Promise<ScheduledReportConfig | null> {
    try {
      const scheduledReport = await db.scheduledReport.findFirst({
        where: {
          id: scheduledReportId,
          OR: [
            { userId: userId },
            { organization: { members: { some: { userId: userId } } } }
          ]
        },
        include: {
          report: {
            select: { id: true, name: true, description: true }
          },
          organization: {
            select: { id: true, name: true }
          }
        }
      });

      if (!scheduledReport) {
        return null;
      }

      return mapToScheduledReportConfig(scheduledReport);
    } catch (error) {
      logger.error('Failed to get scheduled report by ID', 'scheduled-reports', { error, scheduledReportId, userId });
      throw new DatabaseError('Failed to get scheduled report', { 
        userId, 
        operation: 'GET_SCHEDULED_REPORT', 
        metadata: { originalError: error, scheduledReportId } 
      });
    }
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    scheduledReportId: string,
    userId: string,
    updates: UpdateScheduledReportRequest,
  ): Promise<ScheduledReportConfig> {
    try {
      // Check if report exists and user has access
      const existingReport = await db.scheduledReport.findFirst({
        where: {
          id: scheduledReportId,
          OR: [
            { userId: userId },
            { organization: { members: { some: { userId: userId } } } }
          ]
        }
      });

      if (!existingReport) {
        throw new ScheduledReportNotFoundError(scheduledReportId);
      }

      // Validate cron expression if schedule is being updated
      if (updates.schedule && !validateCronExpression(updates.schedule)) {
        throw new CronValidationError(updates.schedule);
      }

      // Calculate next run if schedule is being updated
      let nextRun = existingReport.nextRun;
      if (updates.schedule) {
        nextRun = calculateNextRun(updates.schedule, updates.timezone || existingReport.timezone);
      }

      // Prepare update data
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.schedule !== undefined) {
        updateData.schedule = updates.schedule;
        updateData.nextRun = nextRun;
      }
      if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
      if (updates.recipients !== undefined) updateData.recipients = JSON.stringify(updates.recipients);
      if (updates.format !== undefined) updateData.format = updates.format;
      if (updates.options !== undefined) updateData.options = JSON.stringify(updates.options);
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

      // Update the scheduled report
      const updatedReport = await db.scheduledReport.update({
        where: { id: scheduledReportId },
        data: updateData,
      });

      // Reschedule job if schedule or active status changed
      if (updates.schedule || updates.isActive !== undefined) {
        if (updatedReport.isActive) {
          await this.scheduleReportJob(scheduledReportId, updatedReport.nextRun!);
        } else {
          await this.cancelScheduledJob(scheduledReportId);
        }
      }

      logger.info('Scheduled report updated', 'scheduled-reports', {
        scheduledReportId,
        userId,
        updates: Object.keys(updateData)
      });

      return mapToScheduledReportConfig(updatedReport);
    } catch (error) {
      if (error instanceof ScheduledReportError) {
        throw error;
      }
      
      logger.error('Failed to update scheduled report', 'scheduled-reports', { error, scheduledReportId, userId, updates });
      throw new DatabaseError('Failed to update scheduled report', { 
        userId, 
        operation: 'UPDATE_SCHEDULED_REPORT', 
        metadata: { originalError: error, scheduledReportId, updates } 
      });
    }
  }

  /**
   * Delete a scheduled report
   */
  static async deleteScheduledReport(
    scheduledReportId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Check if report exists and user has access
      const existingReport = await db.scheduledReport.findFirst({
        where: {
          id: scheduledReportId,
          OR: [
            { userId: userId },
            { organization: { members: { some: { userId: userId } } } }
          ]
        }
      });

      if (!existingReport) {
        throw new ScheduledReportNotFoundError(scheduledReportId);
      }

      // Cancel any scheduled jobs
      await this.cancelScheduledJob(scheduledReportId);

      // Delete the scheduled report (this will cascade delete runs)
      await db.scheduledReport.delete({
        where: { id: scheduledReportId },
      });

      logger.info('Scheduled report deleted', 'scheduled-reports', {
        scheduledReportId,
        userId
      });
    } catch (error) {
      if (error instanceof ScheduledReportError) {
        throw error;
      }
      
      logger.error('Failed to delete scheduled report', 'scheduled-reports', { error, scheduledReportId, userId });
      throw new DatabaseError('Failed to delete scheduled report', { 
        userId, 
        operation: 'DELETE_SCHEDULED_REPORT', 
        metadata: { originalError: error, scheduledReportId } 
      });
    }
  }

  /**
   * Execute a scheduled report
   */
  static async executeScheduledReport(
    scheduledReportId: string,
  ): Promise<ScheduledReportExecutionResult> {
    const startTime = Date.now();
    let runId: string | undefined;

    try {
      // Get the scheduled report
      const scheduledReport = await db.scheduledReport.findUnique({
        where: { id: scheduledReportId },
        include: {
          report: true,
          organization: true,
        },
      });

      if (!scheduledReport) {
        throw new ScheduledReportNotFoundError(scheduledReportId);
      }

      if (!scheduledReport.isActive) {
        throw new ScheduledReportError('Scheduled report is not active', 'REPORT_INACTIVE');
      }

      // Parse recipients and options
      const recipients = JSON.parse(scheduledReport.recipients);
      const options = JSON.parse(scheduledReport.options || '{}');

      // Create a run record
      const run = await db.scheduledReportRun.create({
        data: {
          scheduledReportId,
          status: 'pending',
          startedAt: new Date(),
          totalRecipients: recipients.length,
          successfulSends: 0,
          failedSends: 0,
        },
      });

      runId = run.id;

      // Update run status to running
      await db.scheduledReportRun.update({
        where: { id: run.id },
        data: { status: 'running' },
      });

      // Create the job payload
      const jobPayload: ScheduledReportJobPayload = {
        scheduledReportId,
        reportId: scheduledReport.reportId,
        userId: scheduledReport.userId,
        organizationId: scheduledReport.organizationId || undefined,
        format: scheduledReport.format as 'pdf' | 'xlsx' | 'csv',
        recipients,
        options,
        runId: run.id,
      };

      // Queue the export job
      const exportJobId = await QueueHelpers.exportData({
        exportType: scheduledReport.format as 'pdf' | 'csv' | 'excel',
        reportType: 'scheduled_report',
        filters: options.filters,
        options: {
          includeCharts: options.includeCharts,
          includeImages: options.includeMetadata,
          format: 'A4',
          orientation: 'portrait',
        },
        notifyEmail: scheduledReport.recipients?.[0] || 'admin@example.com', // Use first recipient or fallback
        fileName: `${scheduledReport.name}_${new Date().toISOString().split('T')[0]}`,
      }, {
        userId: scheduledReport.userId,
        organizationId: scheduledReport.organizationId || undefined,
      });

      // Update run with export job ID
      await db.scheduledReportRun.update({
        where: { id: run.id },
        data: { exportJobId: exportJobId?.id || null },
      });

      // Send notification emails to recipients
      let successfulSends = 0;
      let failedSends = 0;

      for (const recipient of recipients) {
        try {
          const emailData: ScheduledReportEmailData = {
            organizationName: scheduledReport.organization?.name || 'Your Organization',
            reportName: scheduledReport.name,
            reportType: scheduledReport.report?.name || 'Report',
            reportPeriod: {
              start: options.dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end: options.dateRange?.endDate || new Date().toISOString().split('T')[0],
            },
            summary: {
              totalRecords: 0, // Will be updated by the export job
              generatedAt: new Date().toISOString(),
              fileSize: '0 KB', // Will be updated by the export job
            },
            customMessage: options.customMessage,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App',
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com',
          };

          await emailService.sendEmail({
            to: recipient,
            subject: `Scheduled Report: ${scheduledReport.name}`,
            template: 'scheduled-report',
            templateData: emailData,
          });

          successfulSends++;
        } catch (emailError) {
          logger.error('Failed to send scheduled report email', 'scheduled-reports', {
            recipient,
            scheduledReportId,
            error: emailError
          });
          failedSends++;
        }
      }

      // Update run as completed
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      await db.scheduledReportRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          duration,
          successfulSends,
          failedSends,
        },
      });

      // Update scheduled report's last run and calculate next run
      const nextRun = calculateNextRun(scheduledReport.schedule, scheduledReport.timezone);
      
      await db.scheduledReport.update({
        where: { id: scheduledReportId },
        data: {
          lastRun: new Date(),
          nextRun,
        },
      });

      // Schedule the next run
      await this.scheduleReportJob(scheduledReportId, nextRun);

      logger.info('Scheduled report executed successfully', 'scheduled-reports', {
        scheduledReportId,
        runId: run.id,
        duration,
        successfulSends,
        failedSends,
      });

      return {
        success: true,
        runId: run.id,
        exportJobId: exportJobId?.id || undefined,
        recipientsSent: successfulSends,
        totalRecipients: recipients.length,
        duration,
      };

    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update run as failed if we have a run ID
      if (runId) {
        try {
          await db.scheduledReportRun.update({
            where: { id: runId },
            data: {
              status: 'failed',
              completedAt: new Date(),
              duration,
              errorMessage,
              errorDetails: error instanceof Error ? error.stack : undefined,
            },
          });
        } catch (updateError) {
          logger.error('Failed to update run status to failed', 'scheduled-reports', { updateError });
        }
      }

      logger.error('Failed to execute scheduled report', 'scheduled-reports', {
        scheduledReportId,
        runId,
        error,
        duration,
      });

      return {
        success: false,
        runId: runId || '',
        error: errorMessage,
        recipientsSent: 0,
        totalRecipients: 0,
        duration,
      };
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private static calculateNextRun(
    schedule: ScheduledReportConfig["schedule"],
  ): Date {
    // Since schedule is a cron expression string, use the existing calculateNextRun function
    return calculateNextRun(schedule);
  }



  /**
   * Cancel a scheduled job
   */
  private static async cancelScheduledJob(
    scheduledReportId: string,
  ): Promise<void> {
    // This would need to be implemented in QueueService to cancel jobs by data
    // For now, we'll just log it
    console.log(`Cancelling scheduled job for report ${scheduledReportId}`);
  }

  /**
   * Get scheduled report runs with filtering and pagination
   */
  static async getScheduledReportRuns(
    scheduledReportId: string,
    userId: string,
    organizationId: string,
    options: {
      status?: ScheduledReportRunStatus;
      limit?: number;
      offset?: number;
      sortBy?: 'startedAt' | 'completedAt' | 'duration';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ runs: ScheduledReportRun[]; total: number }> {
    try {
      // Verify user has access to the scheduled report
      const scheduledReport = await db.scheduledReport.findFirst({
        where: {
          id: scheduledReportId,
          OR: [
            { userId },
            { organizationId },
          ],
        },
      });

      if (!scheduledReport) {
        throw new ScheduledReportNotFoundError(scheduledReportId);
      }

      const {
        status,
        limit = 20,
        offset = 0,
        sortBy = 'startedAt',
        sortOrder = 'desc',
      } = options;

      const where = {
        scheduledReportId,
        ...(status && { status }),
      };

      const [runs, total] = await Promise.all([
        db.scheduledReportRun.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
        }),
        db.scheduledReportRun.count({ where }),
      ]);

      return {
         runs: runs.map(mapToScheduledReportRun),
         total,
       };
    } catch (error) {
      if (error instanceof ScheduledReportNotFoundError) {
        throw error;
      }
      logger.error('Failed to get scheduled report runs', 'scheduled-reports', { error, scheduledReportId });
      throw new ScheduledReportError('Failed to get scheduled report runs', 'FETCH_RUNS_ERROR');
    }
  }

  /**
   * Cancel a scheduled report (disable and remove from queue)
   */
  static async cancelScheduledReport(
    scheduledReportId: string,
    userId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      // Verify user has access to the scheduled report
      const scheduledReport = await db.scheduledReport.findFirst({
        where: {
          id: scheduledReportId,
          OR: [
            { userId },
            { organizationId },
          ],
        },
      });

      if (!scheduledReport) {
        throw new ScheduledReportNotFoundError(scheduledReportId);
      }

      // Update the scheduled report to inactive
      await db.scheduledReport.update({
        where: { id: scheduledReportId },
        data: {
          isActive: false,
          nextRun: null,
        },
      });

      // Cancel any pending jobs
      await this.cancelScheduledJob(scheduledReportId);

      logger.info('Scheduled report cancelled', 'scheduled-reports', {
        scheduledReportId,
        userId,
        organizationId,
      });
    } catch (error) {
      if (error instanceof ScheduledReportNotFoundError) {
        throw error;
      }
      logger.error('Failed to cancel scheduled report', 'scheduled-reports', { error, scheduledReportId });
      throw new ScheduledReportError('Failed to cancel scheduled report', 'CANCELLATION_ERROR');
    }
  }

  /**
   * Activate a scheduled report
   */
  static async activateScheduledReport(
    scheduledReportId: string,
    userId: string,
    organizationId: string,
  ): Promise<ScheduledReportConfig> {
    try {
      // Verify user has access to the scheduled report
      const scheduledReport = await db.scheduledReport.findFirst({
        where: {
          id: scheduledReportId,
          OR: [
            { userId },
            { organizationId },
          ],
        },
        include: {
          report: true,
          organization: true,
        },
      });

      if (!scheduledReport) {
        throw new ScheduledReportNotFoundError(scheduledReportId);
      }

      // Calculate next run time
      const nextRun = calculateNextRun(scheduledReport.schedule, scheduledReport.timezone);

      // Update the scheduled report to active
      const updatedReport = await db.scheduledReport.update({
        where: { id: scheduledReportId },
        data: {
          isActive: true,
          nextRun,
        },
        include: {
          report: true,
          organization: true,
        },
      });

      // Schedule the next run
      await this.scheduleReportJob(scheduledReportId, nextRun);

      logger.info('Scheduled report activated', 'scheduled-reports', {
        scheduledReportId,
        userId,
        organizationId,
        nextRun,
      });

      return mapToScheduledReportConfig(updatedReport);
    } catch (error) {
      if (error instanceof ScheduledReportNotFoundError) {
        throw error;
      }
      logger.error('Failed to activate scheduled report', 'scheduled-reports', { error, scheduledReportId });
      throw new ScheduledReportError('Failed to activate scheduled report', 'ACTIVATION_ERROR');
    }
  }

  /**
   * Get scheduled report statistics
   */
  static async getScheduledReportStats(
    organizationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<ScheduledReportStats> {
    try {
      const { startDate, endDate } = options;
      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      } : {};

      const [
        totalReports,
        activeReports,
        totalRuns,
        successfulRuns,
        failedRuns,
        recentRuns,
      ] = await Promise.all([
        db.scheduledReport.count({
          where: { organizationId, ...dateFilter },
        }),
        db.scheduledReport.count({
          where: { organizationId, isActive: true, ...dateFilter },
        }),
        db.scheduledReportRun.count({
          where: {
            scheduledReport: { organizationId },
            ...(startDate && endDate && {
              startedAt: {
                gte: startDate,
                lte: endDate,
              },
            }),
          },
        }),
        db.scheduledReportRun.count({
          where: {
            scheduledReport: { organizationId },
            status: 'completed',
            ...(startDate && endDate && {
              startedAt: {
                gte: startDate,
                lte: endDate,
              },
            }),
          },
        }),
        db.scheduledReportRun.count({
          where: {
            scheduledReport: { organizationId },
            status: 'failed',
            ...(startDate && endDate && {
              startedAt: {
                gte: startDate,
                lte: endDate,
              },
            }),
          },
        }),
        db.scheduledReportRun.findMany({
          where: {
            scheduledReport: { organizationId },
          },
          include: {
            scheduledReport: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 10,
        }),
      ]);

      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;

      return {
        total: totalReports,
        active: activeReports,
        inactive: totalReports - activeReports,
        totalRuns,
        successfulRuns,
        failedRuns,
        lastRunDate: recentRuns.length > 0 ? recentRuns[0].startedAt || undefined : undefined,
        nextRunDate: undefined, // Would need to calculate from active reports
      };
    } catch (error) {
      logger.error('Failed to get scheduled report stats', 'scheduled-reports', { error, organizationId });
      throw new ScheduledReportError('Failed to get scheduled report statistics', 'STATS_ERROR');
    }
  }

  /**
   * Schedule a report job using the queue system
   */
  private static async scheduleReportJob(
    scheduledReportId: string,
    nextRun: Date,
  ): Promise<void> {
    try {
      // Calculate delay until next run
      const delay = Math.max(0, nextRun.getTime() - Date.now());
      
      if (delay > 0) {
        // Create a run record for this scheduled execution
        const run = await db.scheduledReportRun.create({
          data: {
            scheduledReportId,
            status: 'pending',
            startedAt: nextRun,
            totalRecipients: 0, // Will be updated when the job runs
            successfulSends: 0,
            failedSends: 0,
          },
        });

        // Add job to queue with delay
        await QueueHelpers.runScheduledReport(
          { 
            scheduledReportId,
            runId: run.id 
          },
          {
            delay,
          },
        );

        logger.info('Scheduled report job queued', 'scheduled-reports', {
          scheduledReportId,
          nextRun: nextRun.toISOString(),
          delay,
        });
      }
    } catch (error) {
      logger.error('Failed to schedule report job', 'scheduled-reports', {
        error,
        scheduledReportId,
        nextRun,
      });
      throw new ScheduledReportError('Failed to schedule report job', 'SCHEDULING_ERROR');
    }
  }

  /**
   * Get period description for email
   */
  private static getPeriodDescription(frequency: string): string {
    const now = new Date();
    switch (frequency) {
      case "daily":
        return now.toLocaleDateString();
      case "weekly":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      case "monthly":
        return now.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
      default:
        return now.toLocaleDateString();
    }
  }
}
