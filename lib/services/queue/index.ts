import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
// import { logger } from "@/lib/logger";
// import { UsageTrackingService } from "@/lib/services/usage-tracking";

// Mock implementations
const logger = {
  info: (message: string, context?: string, data?: any) => console.log(message, context, data),
  error: (message: string, context?: string, error?: any) => console.error(message, context, error),
  warn: (message: string, context?: string, data?: any) => console.warn(message, context, data),
  debug: (message: string, context?: string, data?: any) => console.log(message, context, data)
};

const UsageTrackingService = {
  updateUsage: async (data: any) => {
    console.log('Mock usage tracking:', data);
  },
  getUsageMetrics: async (organizationId: string) => {
    console.log('Mock get usage metrics:', organizationId);
    return {};
  },
  updateAllUsageMetrics: async () => {
    console.log('Mock update all usage metrics');
  }
};

// Redis connection configuration - lazy loaded
let redisConnection: IORedis | null = null;

function getRedisConnection(): IORedis {
  if (!redisConnection) {
    // Check if we're in an environment that supports Redis
    const isEdgeRuntime = typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis || 
                         process.env.NEXT_RUNTIME === 'edge';
    
    if (isEdgeRuntime) {
      throw new Error("Redis not supported in Edge Runtime");
    }

    redisConnection = new IORedis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }
  return redisConnection;
}

export interface QueueJob {
  id: string;
  type: string;
  data: any;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface ExportJobData {
  jobId: string;
  userId: string;
  organizationId?: string;
  type: "csv" | "json" | "pdf";
  query?: any;
  filters?: any;
}

/**
 * Modern queue service using BullMQ and Redis
 * Replaces the legacy in-memory queue service
 */
class ModernQueueService {
  private static exportQueue: Queue;
  private static exportWorker: Worker;
  private static queueEvents: QueueEvents;
  private static initialized = false;

  /**
   * Initialize the queue system
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create export queue
      this.exportQueue = new Queue("export-jobs", {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      // Create worker for processing export jobs
      this.exportWorker = new Worker(
        "export-jobs",
        async (job) => {
          logger.info("Processing job", "queue-service", {
            jobId: job.id,
            type: job.name,
            data: job.data,
          });

          try {
            let result;

            switch (job.name) {
              case "export-job":
                result = await this.processExportJob(job.data);
                break;
              case "scheduled-report":
                result = await this.processScheduledReportJob(job.data);
                break;
              case "usage-update":
                result = await this.processUsageUpdateJob(job.data);
                break;
              default:
                result = await this.processExportJob(job.data);
                break;
            }

            logger.info("Job completed successfully", "queue-service", {
              jobId: job.id,
              result,
            });

            return result;
          } catch (error) {
            logger.error("Job processing failed", "queue-service", {
              jobId: job.id,
              error: error instanceof Error ? error.message : error,
            });
            throw error;
          }
        },
        {
          connection: getRedisConnection(),
          concurrency: 5,
          limiter: {
            max: 50,
            duration: 60000, // 50 jobs per minute
          },
        },
      );

      // Set up queue events
      this.queueEvents = new QueueEvents("export-jobs", {
        connection: getRedisConnection(),
      });

      // Event listeners
      this.exportWorker.on("completed", (job) => {
        logger.info("Export job completed", "queue", { jobId: job.id });
      });

      this.exportWorker.on("failed", (job, err) => {
        logger.error("Export job failed", "queue", {
          jobId: job?.id,
          error: err.message,
          stack: err.stack,
        });
      });

      this.queueEvents.on("waiting", ({ jobId }) => {
        logger.info("Export job waiting", "queue", { jobId });
      });

      this.queueEvents.on("active", ({ jobId }) => {
        logger.info("Export job started", "queue", { jobId });
      });

      this.initialized = true;
      logger.info("Modern queue service initialized successfully", "queue");
    } catch (error) {
      logger.error("Failed to initialize modern queue service", "queue", error);
      throw error;
    }
  }

  /**
   * Add job to queue
   */
  static async addJob(
    type: string,
    data: any,
    options?: {
      maxAttempts?: number;
      delay?: number;
      priority?: number;
    },
  ): Promise<string> {
    await this.initialize();

    try {
      const job = await this.exportQueue.add(type, data, {
        attempts: options?.maxAttempts || 3,
        delay: options?.delay,
        priority: options?.priority,
      });

      logger.info("Job added to queue", "queue", {
        jobId: job.id,
        type,
        data: JSON.stringify(data),
      });

      return job.id!;
    } catch (error) {
      logger.error("Failed to add job to queue", "queue", error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  static async getJob(jobId: string): Promise<QueueJob | null> {
    await this.initialize();

    try {
      const job = await this.exportQueue.getJob(jobId);
      if (!job) return null;

      return {
        id: job.id!,
        type: job.name,
        data: job.data,
        status: this.mapJobState(
          job.opts.attempts || 0,
          job.finishedOn,
          job.failedReason,
        ),
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts || 3,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        error: job.failedReason,
      };
    } catch (error) {
      logger.error("Failed to get job", "queue", error);
      return null;
    }
  }

  /**
   * Get job status (simplified version for export utils)
   */
  static async getJobStatus(jobId: string): Promise<{ status: string } | null> {
    const job = await this.getJob(jobId);
    return job ? { status: job.status } : null;
  }

  /**
   * Cancel/remove a job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    try {
      await this.initialize();

      const job = await this.exportQueue.getJob(jobId);
      if (!job) return false;

      // Remove the job from the queue
      await job.remove();

      logger.info("Job cancelled successfully", "queue-service", { jobId });
      return true;
    } catch (error) {
      logger.error("Failed to cancel job", "queue-service", { jobId, error });
      return false;
    }
  }

  /**
   * Retry failed job
   */
  static async retryJob(jobId: string): Promise<boolean> {
    await this.initialize();

    try {
      const job = await this.exportQueue.getJob(jobId);
      if (!job) return false;

      await job.retry();
      logger.info("Job retried", "queue", { jobId });
      return true;
    } catch (error) {
      logger.error("Failed to retry job", "queue", error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  static async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    await this.initialize();

    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.exportQueue.getWaiting(),
        this.exportQueue.getActive(),
        this.exportQueue.getCompleted(),
        this.exportQueue.getFailed(),
      ]);

      return {
        total:
          waiting.length + active.length + completed.length + failed.length,
        pending: waiting.length,
        processing: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      logger.error("Failed to get queue stats", "queue", error);
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }

  /**
   * Clean up old jobs
   */
  static async cleanup(): Promise<void> {
    await this.initialize();

    try {
      // Clean completed jobs older than 24 hours
      await this.exportQueue.clean(24 * 60 * 60 * 1000, 100, "completed");
      // Clean failed jobs older than 7 days
      await this.exportQueue.clean(7 * 24 * 60 * 60 * 1000, 50, "failed");

      logger.info("Queue cleanup completed", "queue");
    } catch (error) {
      logger.error("Failed to cleanup queue", "queue", error);
    }
  }

  /**
   * Graceful shutdown
   */
  static async shutdown(): Promise<void> {
    if (!this.initialized) return;

    try {
      await this.exportWorker.close();
      await this.queueEvents.close();
      await this.exportQueue.close();
      if (redisConnection) {
        await redisConnection.disconnect();
      }

      this.initialized = false;
      logger.info("Modern queue service shut down gracefully", "queue");
    } catch (error) {
      logger.error("Error during queue service shutdown", "queue", error);
    }
  }

  /**
   * Process export job
   */
  private static async processExportJob(data: ExportJobData): Promise<any> {
    logger.info("Processing export job", "queue-service", { data });

    try {
      // Mock implementation for export processing
      console.log('Mock export job processing:', data);
      return { success: true, message: "Export completed successfully" };
    } catch (error) {
      logger.error("Export job processing failed", "queue-service", {
        data,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Process scheduled report job
   */
  private static async processScheduledReportJob(data: any): Promise<any> {
    logger.info("Processing scheduled report job", "queue-service", { data });

    try {
      // Mock implementation for scheduled report processing
      console.log('Mock scheduled report processing:', data);
      return {
        success: true,
        message: "Scheduled report executed successfully",
      };
    } catch (error) {
      logger.error("Scheduled report job processing failed", "queue-service", {
        data,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Process usage tracking update job
   */
  private static async processUsageUpdateJob(data: {
    organizationId?: string;
    type: string;
  }): Promise<any> {
    logger.info("Processing usage update job", "queue-service", { data });

    try {
      if (data.organizationId) {
        // Update specific organization
        await UsageTrackingService.getUsageMetrics(data.organizationId);
      } else {
        // Update all organizations
        await UsageTrackingService.updateAllUsageMetrics();
      }

      return { success: true, message: "Usage update completed successfully" };
    } catch (error) {
      logger.error("Usage update job processing failed", "queue-service", {
        data,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Map BullMQ job state to our status enum
   */
  private static mapJobState(
    attempts: number,
    finishedOn?: number,
    failedReason?: string,
  ): "pending" | "processing" | "completed" | "failed" {
    if (failedReason) return "failed";
    if (finishedOn) return "completed";
    if (attempts > 0) return "processing";
    return "pending";
  }
}

// Fallback to legacy service if Redis is not available
export class QueueServiceAdapter {
  static async addJob(type: string, data: any, options?: any): Promise<string> {
    try {
      return await ModernQueueService.addJob(type, data, options);
    } catch (error) {
      logger.warn("Falling back to legacy queue service", "queue", { error });
      const { QueueService } = await import("../queue-service");
      return await QueueService.addJob(type, data, options);
    }
  }

  static async getJob(jobId: string): Promise<QueueJob | null> {
    try {
      return await ModernQueueService.getJob(jobId);
    } catch (error) {
      logger.warn("Falling back to legacy queue service", "queue", { error });
      const { QueueService } = await import("../queue-service");
      return QueueService.getJob(jobId) || null;
    }
  }

  static async getJobStatus(jobId: string): Promise<{ status: string } | null> {
    try {
      return await ModernQueueService.getJobStatus(jobId);
    } catch (error) {
      logger.warn("Falling back to legacy queue service", "queue", { error });
      const { QueueService } = await import("../queue-service");
      return QueueService.getJobStatus(jobId) || null;
    }
  }

  static async cancelJob(jobId: string): Promise<boolean> {
    try {
      return await ModernQueueService.cancelJob(jobId);
    } catch (error) {
      logger.warn("Falling back to legacy queue service", "queue", { error });
      const { QueueService } = await import("../queue-service");
      return await QueueService.cancelJob(jobId);
    }
  }

  static async retryJob(jobId: string): Promise<boolean> {
    try {
      return await ModernQueueService.retryJob(jobId);
    } catch (error) {
      logger.warn("Falling back to legacy queue service", "queue", { error });
      const { QueueService } = await import("../queue-service");
      return await QueueService.retryJob(jobId);
    }
  }

  static async getStats() {
    try {
      return await ModernQueueService.getStats();
    } catch (error) {
      logger.warn("Falling back to legacy queue service", "queue", { error });
      const { QueueService } = await import("../queue-service");
      return QueueService.getStats();
    }
  }
}

// Export the adapter as the default queue service
export const queueService = QueueServiceAdapter;
export { ModernQueueService };
