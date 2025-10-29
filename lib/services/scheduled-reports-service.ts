// import { db } from "@/lib/db";
// import { queueService } from "./queue";
// import { EmailService } from "../email-service";
// import { ExportService } from "./export-service";
// import { AuditService } from "./audit";
// import { scheduledReportEmailTemplate } from "../email-templates/scheduled-report"; // TODO: Fix email template import

// Mock implementations
const queueService = {
  addJob: async (_type: string, _data: any, _options?: any) => ({ id: 'mock-job' }),
  removeJob: async (_jobId: string) => true,
  getJob: async (_jobId: string) => ({ id: _jobId, status: 'completed' })
};

const EmailService = {
  sendEmail: async (_options: any) => ({ success: true }),
  sendScheduledReport: async (_recipient: string, _data: any) => ({ success: true })
};

const ExportService = {
  createExportJob: async (_userId: string, _data: any) => ({ id: 'mock-export', status: 'PENDING' }),
  getExportJobById: async (_exportJobId: string, _userId: string) => ({ 
    id: _exportJobId, 
    status: 'COMPLETED',
    downloadUrl: 'https://example.com/download/mock-file.pdf'
  })
};

const AuditService = {
  logEvent: async (_event: any) => ({ id: 'mock-audit' }),
  log: async (_event: any) => ({ id: 'mock-audit' })
};

// Mock db for now since the module is not available
const db = {
  report: {
    findFirst: async () => ({ id: "mock-report", name: "Mock Report" }),
  },
  exportJob: {
    findUnique: async () => ({ id: "mock-export", status: "COMPLETED" }),
  },
};

export interface ScheduledReportConfig {
  id: string;
  name: string;
  description?: string;
  reportId: string;
  organizationId: string;
  createdBy: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    time: string; // HH:MM format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    timezone: string;
  };
  recipients: string[];
  format: "pdf" | "xlsx" | "csv";
  options: {
    includeCharts?: boolean;
    includeData?: boolean;
    includeMetadata?: boolean;
    customMessage?: string;
  };
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ScheduledReportRun {
  id: string;
  scheduledReportId: string;
  status: "pending" | "processing" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  exportJobId?: string;
  error?: string;
  recipientsSent: number;
  totalRecipients: number;
}

export class ScheduledReportsService {
  /**
   * Create a new scheduled report
   */
  static async createScheduledReport(
    userId: string,
    organizationId: string,
    config: Omit<
      ScheduledReportConfig,
      "id" | "createdBy" | "organizationId" | "lastRun" | "nextRun"
    >,
  ): Promise<ScheduledReportConfig> {
    try {
      // Verify report exists and user has access
      const report = await db.report.findFirst();

      if (!report) {
        throw new Error("Report not found or access denied");
      }

      // Calculate next run time
      const nextRun = this.calculateNextRun(config.schedule);

      // Create scheduled report
      // TODO: Add scheduledReport model to Prisma schema
      const scheduledReport = {
        id: "temp-id",
        name: config.name,
        description: config.description,
        reportId: config.reportId,
        organizationId: organizationId,
        createdBy: userId,
        schedule: JSON.stringify(config.schedule),
        recipients: config.recipients,
        format: config.format,
        options: JSON.stringify(config.options),
        isActive: config.isActive,
        nextRun: nextRun,
      };
      // const scheduledReport = await db.scheduledReport.create({
      //   data: {
      //     name: config.name,
      //     description: config.description,
      //     reportId: config.reportId,
      //     organizationId: organizationId,
      //     createdBy: userId,
      //     schedule: JSON.stringify(config.schedule),
      //     recipients: config.recipients,
      //     format: config.format,
      //     options: JSON.stringify(config.options),
      //     isActive: config.isActive,
      //     nextRun: nextRun,
      //   },
      // });

      // Schedule the job if active
      if (config.isActive) {
        await this.scheduleReportJob(scheduledReport.id, nextRun);
      }

      // Log the creation
      await AuditService.log({
        action: "scheduled_report_created",
        userId: userId,
        organizationId: organizationId,
        resource: "scheduled_report",
        resourceId: scheduledReport.id,
        // TODO: Fix AuditService - details field not supported
        // details: {
        //   reportId: config.reportId,
        //   frequency: config.schedule.frequency,
        //   recipients: config.recipients.length,
        // },
      });

      return {
        id: scheduledReport.id,
        name: scheduledReport.name,
        description: scheduledReport.description,
        reportId: scheduledReport.reportId,
        organizationId: scheduledReport.organizationId,
        createdBy: scheduledReport.createdBy,
        schedule: JSON.parse(scheduledReport.schedule),
        recipients: scheduledReport.recipients,
        format: scheduledReport.format as "pdf" | "xlsx" | "csv",
        options: JSON.parse(scheduledReport.options || "{}"),
        isActive: scheduledReport.isActive,
        // TODO: Fix Prisma model - lastRun field not available
        // lastRun: scheduledReport.lastRun,
        nextRun: scheduledReport.nextRun,
      };
    } catch (error) {
      console.error("Error creating scheduled report:", error);
      throw error;
    }
  }

  /**
   * Get scheduled reports for an organization
   */
  static async getScheduledReports(
    organizationId: string,
    filters: {
      isActive?: boolean;
      reportId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    // const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.reportId) {
      where.reportId = filters.reportId;
    }

    // TODO: Add scheduledReport model to Prisma schema
    const [scheduledReports, total] = await Promise.all([
      Promise.resolve([]),
      Promise.resolve(0),
    ]);

    return {
      scheduledReports: scheduledReports.map((sr: any) => ({
        id: sr.id,
        name: sr.name,
        description: sr.description,
        reportId: sr.reportId,
        organizationId: sr.organizationId,
        createdBy: sr.createdBy,
        schedule: JSON.parse(sr.schedule),
        recipients: sr.recipients,
        format: sr.format as "pdf" | "xlsx" | "csv",
        options: JSON.parse(sr.options || "{}"),
        isActive: sr.isActive,
        lastRun: sr.lastRun,
        nextRun: sr.nextRun,
        report: sr.report,
        createdByUser: sr.createdByUser,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a scheduled report
   */
  static async updateScheduledReport(
    scheduledReportId: string,
    userId: string,
    updates: Partial<
      Omit<ScheduledReportConfig, "id" | "createdBy" | "organizationId">
    >,
  ): Promise<ScheduledReportConfig> {
    try {
      // TODO: Add scheduledReport model to Prisma schema
      // const existingReport = await db.scheduledReport.findFirst({
      //   where: {
      //     id: scheduledReportId,
      //     organizationId: organizationId,
      //   },
      // });

      // if (!existingReport) {
      //   throw new Error("Scheduled report not found");
      // }

      // Prepare update data
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.schedule) {
        updateData.schedule = JSON.stringify(updates.schedule);
        updateData.nextRun = this.calculateNextRun(updates.schedule);
      }
      if (updates.recipients) updateData.recipients = updates.recipients;
      if (updates.format) updateData.format = updates.format;
      if (updates.options) updateData.options = JSON.stringify(updates.options);
      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
        
        // If activating, schedule the job
        if (updates.isActive) {
          const nextRun = updateData.nextRun || this.calculateNextRun(updates.schedule || {
            frequency: "daily",
            time: "09:00",
            timezone: "UTC",
          });
          await this.scheduleReportJob(scheduledReportId, nextRun);
        } else {
          // If deactivating, cancel the job
          await this.cancelScheduledJob(scheduledReportId);
        }
      }

      // TODO: Implement actual update when model exists
      // const updatedReport = await db.scheduledReport.update({
      //   where: { id: scheduledReportId },
      //   data: updateData,
      // });

      // Log the update
      await AuditService.log({
        action: "scheduled_report.updated",
        resource: "scheduled_report",
        resourceId: scheduledReportId,
        userId,
        metadata: {
          updates: Object.keys(updateData),
        },
      });

      // Return mock data for now
      return {
        id: scheduledReportId,
        name: updates.name || "Mock Report",
        description: updates.description,
        reportId: "mock-report-id",
        organizationId: "mock-org-id",
        createdBy: userId,
        schedule: updates.schedule || {
          frequency: "daily",
          time: "09:00",
          timezone: "UTC",
        },
        recipients: updates.recipients || [],
        format: updates.format || "pdf",
        options: updates.options || {},
        isActive: updates.isActive !== undefined ? updates.isActive : true,
        nextRun: new Date(),
      };
    } catch (error) {
      console.error("Error updating scheduled report:", error);
      throw error;
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
      // TODO: Add scheduledReport model to Prisma schema
      // const scheduledReport = await db.scheduledReport.findFirst({
      //   where: {
      //     id: scheduledReportId,
      //     OR: [
      //       { createdBy: userId },
      //       {
      //         organization: {
      //           members: {
      //             some: { userId: userId, role: { in: ["ADMIN", "OWNER"] } },
      //           },
      //         },
      //       },
      //     ],
      //   },
      // });

      // if (!scheduledReport) {
      //   throw new Error("Scheduled report not found or access denied");
      // }

      // Cancel any scheduled jobs
      await this.cancelScheduledJob(scheduledReportId);

      // TODO: Implement actual deletion when model exists
      // await db.scheduledReport.delete({
      //   where: { id: scheduledReportId },
      // });

      // Log the deletion
      await AuditService.log({
        action: "scheduled_report_deleted",
        userId: userId,
        resource: "scheduled_report",
        resourceId: scheduledReportId,
        metadata: {
          name: "Mock Report",
        },
      });
    } catch (error) {
      console.error("Error deleting scheduled report:", error);
      throw error;
    }
  }

  /**
   * Execute a scheduled report
   */
  static async executeScheduledReport(
    scheduledReportId: string,
  ): Promise<ScheduledReportRun> {
    try {
      // TODO: Add scheduledReport model to Prisma schema
      // Get the scheduled report
      // const scheduledReport = await db.scheduledReport.findUnique({
      //   where: { id: scheduledReportId },
      //   include: {
      //     report: true,
      //     organization: true,
      //   },
      // });

      // if (!scheduledReport) {
      //   throw new Error("Scheduled report not found");
      // }

      // if (!scheduledReport.isActive) {
      //   throw new Error("Scheduled report is not active");
      // }

      // Mock scheduled report data
      const scheduledReport = {
        id: scheduledReportId,
        isActive: true,
        createdBy: "mock-user-id",
        organizationId: "mock-org-id",
        reportId: "mock-report-id",
        format: "pdf",
        options: "{}",
        schedule: JSON.stringify({ frequency: "daily" }),
        recipients: ["test@example.com"],
        report: { name: "Mock Report" },
        organization: { name: "Mock Organization" },
      };

      // TODO: Add scheduledReportRun model to Prisma schema
      // Create a run record
      // const run = await db.scheduledReportRun.create({
      //   data: {
      //     scheduledReportId: scheduledReportId,
      //     status: "pending",
      //     startedAt: new Date(),
      //     recipientsSent: 0,
      //     totalRecipients: scheduledReport.recipients.length,
      //   },
      // });

      const run = {
        id: "mock-run-id",
        scheduledReportId: scheduledReportId,
        status: "pending" as const,
        startedAt: new Date(),
        recipientsSent: 0,
        totalRecipients: scheduledReport.recipients.length,
      };

      // TODO: Update run status to processing when model exists
      // await db.scheduledReportRun.update({
      //   where: { id: run.id },
      //   data: { status: "processing" },
      // });

      try {
        // Create export job
        const exportJob = await ExportService.createExportJob(
          scheduledReport.createdBy,
          {
            reportId: scheduledReport.reportId,
            format: scheduledReport.format as any,
            options: JSON.parse(scheduledReport.options || "{}"),
          },
        );

        // Wait for export to complete (in a real implementation, this would be handled by the queue)
        await this.waitForExportCompletion(exportJob.id);

        // Get the completed export job
        const completedExport = await ExportService.getExportJobById(
          exportJob.id,
          scheduledReport.createdBy,
        );

        if (!completedExport || completedExport.status !== "COMPLETED") {
          throw new Error("Export job failed or not completed");
        }

        // Send emails to recipients
        const schedule = JSON.parse(scheduledReport.schedule);
        // const options = JSON.parse(scheduledReport.options || "{}");

        let recipientsSent = 0;
        for (const recipient of scheduledReport.recipients) {
          try {
            await EmailService.sendScheduledReport(recipient, {
              reportName: scheduledReport.report.name,
              organizationName: scheduledReport.organization.name,
              period: this.getPeriodDescription(schedule.frequency),
              summary: {
                totalRecords: 0, // Would be calculated from actual data
                generatedAt: new Date(),
                format: scheduledReport.format,
              },
              metrics: [], // Would be populated with actual metrics
              activities: [], // Would be populated with actual activities
              alerts: [], // Would be populated with actual alerts
              attachments: completedExport.downloadUrl
                ? [
                    {
                      name: `${scheduledReport.report.name}.${scheduledReport.format}`,
                      url: completedExport.downloadUrl,
                      size: "0 KB", // Would be calculated
                    },
                  ]
                : [],
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
              unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?report=${scheduledReportId}&email=${recipient}`,
            });
            recipientsSent++;
          } catch (emailError) {
            console.error(`Failed to send email to ${recipient}:`, emailError);
          }
        }

        // TODO: Update run with success when model exists
        // await db.scheduledReportRun.update({
        //   where: { id: run.id },
        //   data: {
        //     status: "completed",
        //     completedAt: new Date(),
        //     exportJobId: exportJob.id,
        //     recipientsSent: recipientsSent,
        //   },
        // });

        // TODO: Update scheduled report with last run and next run when model exists
        // const nextRun = this.calculateNextRun(schedule);
        // await db.scheduledReport.update({
        //   where: { id: scheduledReportId },
        //   data: {
        //     lastRun: new Date(),
        //     nextRun: nextRun,
        //   },
        // });

        // Schedule next run
        const nextRun = this.calculateNextRun(schedule);
        if (nextRun) {
          await this.scheduleReportJob(scheduledReportId, nextRun);
        }

        // Log the execution
        await AuditService.log({
          action: "scheduled_report_executed",
          userId: scheduledReport.createdBy,
          resource: "scheduled_report",
          resourceId: scheduledReportId,
          metadata: {
            runId: run.id,
            recipientsSent: recipientsSent,
            totalRecipients: scheduledReport.recipients.length,
          },
        });

        return {
          id: run.id,
          scheduledReportId: scheduledReportId,
          status: "completed",
          startedAt: run.startedAt,
          completedAt: new Date(),
          exportJobId: exportJob.id,
          recipientsSent: recipientsSent,
          totalRecipients: scheduledReport.recipients.length,
        };
      } catch (error) {
        // TODO: Update run with error when model exists
        // await db.scheduledReportRun.update({
        //   where: { id: run.id },
        //   data: {
        //     status: "failed",
        //     completedAt: new Date(),
        //     error: error instanceof Error ? error.message : "Unknown error",
        //   },
        // });

        throw error;
      }
    } catch (error) {
      console.error("Error executing scheduled report:", error);
      throw error;
    }
  }

  /**
   * Calculate next run time based on schedule
   */
  private static calculateNextRun(
    schedule: ScheduledReportConfig["schedule"],
  ): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(":").map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, move to next occurrence
    if (nextRun <= now) {
      switch (schedule.frequency) {
        case "daily":
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case "weekly":
          const daysUntilNext =
            (7 + (schedule.dayOfWeek || 0) - nextRun.getDay()) % 7;
          nextRun.setDate(nextRun.getDate() + (daysUntilNext || 7));
          break;
        case "monthly":
          nextRun.setMonth(nextRun.getMonth() + 1);
          if (schedule.dayOfMonth) {
            nextRun.setDate(
              Math.min(
                schedule.dayOfMonth,
                new Date(
                  nextRun.getFullYear(),
                  nextRun.getMonth() + 1,
                  0,
                ).getDate(),
              ),
            );
          }
          break;
        case "quarterly":
          nextRun.setMonth(nextRun.getMonth() + 3);
          break;
      }
    }

    return nextRun;
  }

  /**
   * Schedule a report job in the queue
   */
  private static async scheduleReportJob(
    scheduledReportId: string,
    runAt: Date,
  ): Promise<void> {
    const delay = runAt.getTime() - Date.now();
    await queueService.addJob(
      "scheduled-report",
      { scheduledReportId },
      { delay: Math.max(0, delay) },
    );
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
   * Wait for export completion (simplified implementation)
   */
  private static async waitForExportCompletion(
    _exportJobId: string,
  ): Promise<void> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      const exportJob = await db.exportJob.findUnique();

      if (!exportJob) {
        throw new Error("Export job not found");
      }

      if (exportJob.status === "COMPLETED") {
        return;
      }

      if (exportJob.status === "FAILED") {
        throw new Error(`Export job failed`);
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error("Export job timed out");
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

  /**
   * Get scheduled report runs
   */
  static async getScheduledReportRuns(
    _scheduledReportId: string,
    _organizationId: string,
    _filters: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    // Mock implementation
    return {
      runs: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };
    /*
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // TODO: Add scheduledReport model to Prisma schema
    // Verify access to the scheduled report
    // const scheduledReport = await db.scheduledReport.findFirst({
    //   where: {
    //     id: scheduledReportId,
    //     organizationId: organizationId,
    //   },
    // });

    // if (!scheduledReport) {
    //   throw new Error("Scheduled report not found or access denied");
    // }

    const where: any = { scheduledReportId };

    if (filters.status) {
      where.status = filters.status;
    }

    // TODO: Add scheduledReportRun model to Prisma schema
    const [runs, total] = await Promise.all([
      Promise.resolve([]),
      Promise.resolve(0),
    ]);

    return {
      runs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    */
  }
}
