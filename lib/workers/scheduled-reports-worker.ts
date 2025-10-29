import { Worker } from "bullmq";
import { ScheduledReportsService } from "../services/scheduled-reports-service";
import { ReportTemplatesService } from "../services/report-templates-service";
import { AuditService } from "../services/audit";

interface ScheduledReportJobData {
  scheduledReportId: string;
}

interface ReportTemplateInitJobData {
  force?: boolean;
}

/**
 * Worker for processing scheduled report jobs
 */
export class ScheduledReportsWorker {
  private worker: Worker;

  constructor(redisConnection: any) {
    this.worker = new Worker(
      "scheduled-reports",
      async (job) => {
        const { name, data } = job;

        try {
          switch (name) {
            case "execute-scheduled-report":
              return await this.executeScheduledReport(
                data as ScheduledReportJobData,
              );

            case "init-system-templates":
              return await this.initializeSystemTemplates(
                data as ReportTemplateInitJobData,
              );

            default:
              throw new Error(`Unknown job type: ${name}`);
          }
        } catch (error) {
          console.error(`Error processing job ${name}:`, error);

          // Log the error for audit purposes
          await AuditService.log({
            action: "scheduled_report_job_failed",
            userId: "system",
            organizationId: undefined,
            resource: "scheduled_report_job",
            resourceId: job.id || "unknown",
            category: "system",
            severity: "error",
            status: "failure",
            ipAddress: "127.0.0.1",
            metadata: {
              jobName: name,
              jobData: data,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });

          throw error;
        }
      },
      {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 jobs concurrently
        removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
        removeOnFail: { count: 50 }, // Keep last 50 failed jobs
      },
    );

    this.setupEventHandlers();
  }

  /**
   * Execute a scheduled report
   */
  private async executeScheduledReport(data: ScheduledReportJobData) {
    const { scheduledReportId } = data;

    console.log(`Executing scheduled report: ${scheduledReportId}`);

    try {
      const run =
        await ScheduledReportsService.executeScheduledReport(scheduledReportId);

      console.log(
        `Scheduled report executed successfully: ${scheduledReportId}, run: ${run.id}`,
      );

      return {
        success: true,
        runId: run.id,
        recipientsSent: run.recipientsSent,
        totalRecipients: run.totalRecipients,
      };
    } catch (error) {
      console.error(
        `Failed to execute scheduled report ${scheduledReportId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Initialize system report templates
   */
  private async initializeSystemTemplates(data: ReportTemplateInitJobData) {
    const { force } = data;
    // Use force parameter if needed in the future
    console.log("Force parameter:", force);

    console.log("Initializing system report templates...");

    try {
      await ReportTemplatesService.initializeSystemTemplates();

      console.log("System report templates initialized successfully");

      return {
        success: true,
        message: "System templates initialized",
      };
    } catch (error) {
      console.error("Failed to initialize system templates:", error);
      throw error;
    }
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers() {
    this.worker.on("completed", (job, result) => {
      console.log(`Job ${job.id} completed successfully:`, result);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });

    this.worker.on("error", (err) => {
      console.error("Worker error:", err);
    });

    this.worker.on("stalled", (jobId) => {
      console.warn(`Job ${jobId} stalled`);
    });
  }

  /**
   * Start the worker
   */
  async start() {
    console.log("Starting scheduled reports worker...");
    // Worker starts automatically when created
  }

  /**
   * Stop the worker gracefully
   */
  async stop() {
    console.log("Stopping scheduled reports worker...");
    await this.worker.close();
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isRunning: !this.worker.closing,
      name: this.worker.name,
      concurrency: this.worker.opts.concurrency,
    };
  }
}

/**
 * Create and start the scheduled reports worker
 */
export async function createScheduledReportsWorker(redisConnection: any) {
  const worker = new ScheduledReportsWorker(redisConnection);
  await worker.start();
  return worker;
}

/**
 * Utility function to schedule system template initialization
 */
export async function scheduleSystemTemplateInit(
  queueService: any,
  force = false,
) {
  try {
    await queueService.addJob(
      "scheduled-reports",
      "init-system-templates",
      { force },
      { priority: 10 }, // High priority
    );

    console.log("System template initialization job scheduled");
  } catch (error) {
    console.error("Failed to schedule system template initialization:", error);
    throw error;
  }
}
