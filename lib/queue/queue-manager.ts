/**
 * Queue Manager
 * Manages BullMQ queues and workers
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { queueConfig, JobType, QueuePriority } from './config';

export interface QueueJobData {
  type: JobType;
  payload: any;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private isInitialized = false;
  private autoStart: boolean;

  constructor() {
    this.autoStart = process.env.QUEUE_AUTOSTART !== 'false';

    if (this.autoStart) {
      void this.initialize();
    } else {
      console.log('[QueueManager] Auto-start disabled; initialization skipped');
    }
  }

  /**
   * Initialize queue manager
   */
  private async initialize(): Promise<void> {
    try {
      // Create queues
      for (const [name, queueName] of Object.entries(queueConfig.queues)) {
        const queue = new Queue(queueName, {
          connection: queueConfig.redis,
          defaultJobOptions: queueConfig.defaultJobOptions,
        });

        this.queues.set(name, queue);

        // Create queue events for monitoring
        const queueEvents = new QueueEvents(queueName, {
          connection: queueConfig.redis,
        });

        this.queueEvents.set(name, queueEvents);

        console.log(`[QueueManager] Queue '${name}' initialized`);
      }

      this.isInitialized = true;
      console.log('[QueueManager] All queues initialized successfully');

    } catch (error) {
      console.error('[QueueManager] Failed to initialize queues:', error);
      throw error;
    }
  }

  /**
   * Ensure queues are ready before operating
   */
  private async ensureInitialized(): Promise<boolean> {
    if (!this.autoStart) {
      console.warn('[QueueManager] Queue auto-start disabled; skipping queue operations');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    await this.initialize();
    return this.isInitialized;
  }

  /**
   * Add job to queue
   */
  async addJob(
    queueName: string,
    jobData: QueueJobData,
    options: QueueJobOptions = {}
  ): Promise<Job | null> {
    try {
      const ready = await this.ensureInitialized();
      if (!ready) {
        return null;
      }

      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
      }

      const jobOptions = {
        priority: options.priority || QueuePriority.NORMAL,
        delay: options.delay || 0,
        attempts: options.attempts || queueConfig.defaultJobOptions.attempts,
        removeOnComplete: options.removeOnComplete || queueConfig.defaultJobOptions.removeOnComplete,
        removeOnFail: options.removeOnFail || queueConfig.defaultJobOptions.removeOnFail,
      };

      const job = await queue.add(jobData.type, jobData, jobOptions);

      console.log(`[QueueManager] Job added to ${queueName}:`, {
        jobId: job.id,
        type: jobData.type,
        priority: jobOptions.priority,
      });

      return job;

    } catch (error) {
      console.error(`[QueueManager] Failed to add job to ${queueName}:`, error);
      return null;
    }
  }

  /**
   * Add email job
   */
  async addEmailJob(jobData: Omit<QueueJobData, 'type'> & { type?: JobType }, options?: QueueJobOptions): Promise<Job | null> {
    return this.addJob('email', {
      ...jobData,
      type: jobData.type || 'send-email' as JobType,
    }, options);
  }

  /**
   * Add export job
   */
  async addExportJob(jobData: Omit<QueueJobData, 'type'> & { type?: JobType }, options?: QueueJobOptions): Promise<Job | null> {
    return this.addJob('export', {
      ...jobData,
      type: jobData.type || 'export-data' as JobType,
    }, options);
  }

  /**
   * Add report job
   */
  async addReportJob(jobData: Omit<QueueJobData, 'type'> & { type?: JobType }, options?: QueueJobOptions): Promise<Job | null> {
    return this.addJob('report', {
      ...jobData,
      type: jobData.type || 'generate-report' as JobType,
    }, options);
  }

  /**
   * Add notification job
   */
  async addNotificationJob(jobData: Omit<QueueJobData, 'type'> & { type?: JobType }, options?: QueueJobOptions): Promise<Job | null> {
    return this.addJob('notification', {
      ...jobData,
      type: jobData.type || 'system-notification' as JobType,
    }, options);
  }

  /**
   * Create worker for queue
   */
  createWorker(
    queueName: string,
    processor: (job: Job<QueueJobData>) => Promise<any>,
    concurrency = 5
  ): Worker | null {
    try {
      if (!this.autoStart || !this.isInitialized) {
        console.warn('[QueueManager] Cannot create worker because queues are not initialized');
        return null;
      }

      const queueKey = queueConfig.queues[queueName as keyof typeof queueConfig.queues];
      if (!queueKey) {
        throw new Error(`Queue configuration for '${queueName}' not found`);
      }

      const worker = new Worker(queueKey, processor, {
        connection: queueConfig.redis,
        concurrency,
      });

      // Add event listeners
      worker.on('completed', (job) => {
        console.log(`[QueueManager] Job ${job.id} completed in ${queueName}`);
      });

      worker.on('failed', (job, err) => {
        console.error(`[QueueManager] Job ${job?.id} failed in ${queueName}:`, err);
      });

      worker.on('error', (err) => {
        console.error(`[QueueManager] Worker error in ${queueName}:`, err);
      });

      this.workers.set(queueName, worker);
      console.log(`[QueueManager] Worker created for ${queueName} with concurrency ${concurrency}`);

      return worker;

    } catch (error) {
      console.error(`[QueueManager] Failed to create worker for ${queueName}:`, error);
      return null;
    }
  }

  /**
   * Get queue by name
   */
  getQueue(queueName: string): Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Get worker by name
   */
  getWorker(queueName: string): Worker | undefined {
    return this.workers.get(queueName);
  }

  /**
   * Get queue events by name
   */
  getQueueEvents(queueName: string): QueueEvents | undefined {
    return this.queueEvents.get(queueName);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<any> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      return {
        error: 'Queue system disabled',
      };
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    const ready = await this.ensureInitialized();
    if (!ready) {
      return stats;
    }

    for (const queueName of this.queues.keys()) {
      try {
        stats[queueName] = await this.getQueueStats(queueName);
      } catch (error) {
        console.error(`[QueueManager] Failed to get stats for ${queueName}:`, error);
        stats[queueName] = { error: 'Failed to get stats' };
      }
    }

    return stats;
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      return;
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.pause();
    console.log(`[QueueManager] Queue '${queueName}' paused`);
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      return;
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.resume();
    console.log(`[QueueManager] Queue '${queueName}' resumed`);
  }

  /**
   * Clean queue (remove completed/failed jobs)
   */
  async cleanQueue(queueName: string, grace = 24 * 60 * 60 * 1000): Promise<void> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      return;
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await Promise.all([
      queue.clean(grace, 100, 'completed'),
      queue.clean(grace, 50, 'failed'),
    ]);

    console.log(`[QueueManager] Queue '${queueName}' cleaned`);
  }

  /**
   * Shutdown queue manager
   */
  async shutdown(): Promise<void> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      return;
    }

    console.log('[QueueManager] Shutting down...');

    // Close all workers
    for (const [name, worker] of this.workers) {
      try {
        await worker.close();
        console.log(`[QueueManager] Worker '${name}' closed`);
      } catch (error) {
        console.error(`[QueueManager] Failed to close worker '${name}':`, error);
      }
    }

    // Close all queue events
    for (const [name, queueEvents] of this.queueEvents) {
      try {
        await queueEvents.close();
        console.log(`[QueueManager] Queue events '${name}' closed`);
      } catch (error) {
        console.error(`[QueueManager] Failed to close queue events '${name}':`, error);
      }
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      try {
        await queue.close();
        console.log(`[QueueManager] Queue '${name}' closed`);
      } catch (error) {
        console.error(`[QueueManager] Failed to close queue '${name}':`, error);
      }
    }

    console.log('[QueueManager] Shutdown complete');
  }

  /**
   * Check if queue manager is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const queueManager = new QueueManager();
