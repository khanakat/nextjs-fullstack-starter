import { Queue, Worker, Job as BullJob } from 'bullmq';
import { injectable } from 'inversify';
import { Result } from '../../application/base/result';
import { BackgroundJob } from '../../domain/background-jobs/entities/background-job';
import { JobQueue } from '../../domain/background-jobs/entities/job-queue';
import type { IBackgroundJobRepository } from '../../domain/background-jobs/repositories/background-job-repository';
import type { IJobQueueRepository } from '../../domain/background-jobs/repositories/job-queue-repository';
import { JobStatus } from '../../domain/background-jobs/value-objects/job-status';
import { JobPriority } from '../../domain/background-jobs/value-objects/job-priority';
import { JobId } from '../../domain/background-jobs/value-objects/job-id';

export type JobProcessor = (job: BullJob) => Promise<unknown>;

/**
 * BullMQ integration service for background job processing.
 * This service wraps BullMQ to provide clean architecture integration.
 */
@injectable()
export class BullMqIntegrationService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private processors: Map<string, JobProcessor> = new Map();

  constructor(
    private readonly jobRepository: IBackgroundJobRepository,
    private readonly queueRepository: IJobQueueRepository,
    private readonly redisConnection: { host: string; port: number },
  ) {}

  /**
   * Initialize a queue for a specific job queue entity.
   */
  async initializeQueue(queue: JobQueue): Promise<Result<void>> {
    try {
      // @ts-ignore - ValueObject typed as string
      const queueName = queue.name.value;

      if (this.queues.has(queueName)) {
        return Result.success(void 0);
      }

      const bullQueue = new Queue(queueName, {
        connection: this.redisConnection,
        defaultJobOptions: {
          // @ts-ignore - ValueObject typed as number
          priority: queue.defaultPriority.value,
          attempts: queue.maxRetries,
          removeOnComplete: {
            age: 7 * 24 * 60 * 60, // 7 days
            count: 1000,
          },
          removeOnFail: {
            age: 30 * 24 * 60 * 60, // 30 days
            count: 5000,
          },
        },
      });

      this.queues.set(queueName, bullQueue);

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to initialize queue: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Register a job processor for a specific queue.
   */
  registerProcessor(queueName: string, processor: JobProcessor): void {
    this.processors.set(queueName, processor);
  }

  /**
   * Start a worker for a specific queue.
   */
  async startWorker(queueName: string): Promise<Result<void>> {
    try {
      if (this.workers.has(queueName)) {
        return Result.failure(new Error('Worker already running for this queue'));
      }

      const processor = this.processors.get(queueName);
      if (!processor) {
        return Result.failure(new Error('No processor registered for this queue'));
      }

      const worker = new Worker(
        queueName,
        async (job: BullJob) => {
          return this.handleJobProcessing(job, queueName);
        },
        {
          connection: this.redisConnection,
          concurrency: await this.getConcurrency(queueName),
        }
      );

      worker.on('completed', async (job: BullJob) => {
        await this.handleJobCompleted(job);
      });

      worker.on('failed', async (job: BullJob | undefined, error: Error) => {
        if (job) {
          await this.handleJobFailed(job, error);
        }
      });

      // @ts-ignore - BullMQ type mismatch for progress handler
      worker.on('progress', async (job: BullJob, progress: number) => {
        await this.handleJobProgress(job, progress);
      });

      this.workers.set(queueName, worker);

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to start worker: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Stop a worker for a specific queue.
   */
  async stopWorker(queueName: string): Promise<Result<void>> {
    try {
      const worker = this.workers.get(queueName);
      if (!worker) {
        return Result.failure(new Error('No worker running for this queue'));
      }

      await worker.close();
      this.workers.delete(queueName);

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to stop worker: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Add a job to a queue.
   */
  async addJob(job: BackgroundJob): Promise<Result<void>> {
    try {
      // @ts-ignore - ValueObject typed as string
      const queueName = job.queueName.value;
      const queue = this.queues.get(queueName);

      if (!queue) {
        return Result.failure(new Error(`Queue not found: ${queueName}`));
      }

      await queue.add(
        // @ts-ignore - ValueObject typed as string
        job.name.value,
        job.data, {
          // @ts-ignore - ValueObject typed as string
          jobId: job.id.value,
          // @ts-ignore - ValueObject typed as number
          priority: job.priority.value,
          delay: job.delay,
          attempts: job.maxAttempts,
          // @ts-ignore - timeout property exists in BullMQ but not in type definition
          timeout: job.timeout,
        }
      );

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to add job: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Retry a failed job.
   */
  async retryJob(jobId: JobId): Promise<Result<void>> {
    try {
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        return Result.failure(new Error('Job not found'));
      }

      if (!job.canRetry()) {
        return Result.failure(new Error('Job cannot be retried'));
      }

      // @ts-ignore - ValueObject typed as string
      const queueName = job.queueName.value;
      const queue = this.queues.get(queueName);

      if (!queue) {
        return Result.failure(new Error(`Queue not found: ${queueName}`));
      }

      await queue.add(
        // @ts-ignore - ValueObject typed as string
        job.name.value,
        job.data, {
          // @ts-ignore - ValueObject typed as string
          jobId: job.id.value,
          // @ts-ignore - ValueObject typed as number
          priority: job.priority.value,
          delay: job.delay,
          attempts: job.maxAttempts,
          // @ts-ignore - timeout property exists in BullMQ but not in type definition
          timeout: job.timeout,
        }
      );

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to retry job: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Delete a job from the queue.
   */
  async deleteJob(jobId: JobId): Promise<Result<void>> {
    try {
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        return Result.failure(new Error('Job not found'));
      }

      // @ts-ignore - ValueObject typed as string
      const queueName = job.queueName.value;
      const queue = this.queues.get(queueName);

      if (!queue) {
        return Result.failure(new Error(`Queue not found: ${queueName}`));
      }

      await queue.remove(jobId.value);

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to delete job: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Pause a queue.
   */
  async pauseQueue(queueName: string): Promise<Result<void>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        return Result.failure(new Error(`Queue not found: ${queueName}`));
      }

      await queue.pause();

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to pause queue: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Resume a paused queue.
   */
  async resumeQueue(queueName: string): Promise<Result<void>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        return Result.failure(new Error(`Queue not found: ${queueName}`));
      }

      await queue.resume();

      return Result.success(void 0);
    } catch (error) {
      return Result.failure(
        new Error(`Failed to resume queue: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Get queue statistics from BullMQ.
   */
  async getQueueStatistics(queueName: string): Promise<Result<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }>> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        return Result.failure(new Error(`Queue not found: ${queueName}`));
      }

      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);

      return Result.success({
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused: paused ? 1 : 0,
      });
    } catch (error) {
      return Result.failure(
        new Error(`Failed to get queue statistics: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Close all queues and workers.
   */
  async close(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const worker of this.workers.values()) {
      closePromises.push(worker.close());
    }

    for (const queue of this.queues.values()) {
      closePromises.push(queue.close());
    }

    await Promise.all(closePromises);

    this.workers.clear();
    this.queues.clear();
  }

  /**
   * Handle job processing.
   */
  private async handleJobProcessing(job: BullJob, queueName: string): Promise<unknown> {
    const jobId = JobId.create(job.id!);
    const domainJob = await this.jobRepository.findById(jobId);

    if (!domainJob) {
      throw new Error(`Job not found: ${jobId.value}`);
    }

    // Mark job as active
    domainJob.start();
    await this.jobRepository.save(domainJob);

    // Get the processor for this queue
    const processor = this.processors.get(queueName);
    if (!processor) {
      throw new Error(`No processor registered for queue: ${queueName}`);
    }

    // Execute the processor
    const result = await processor(job);

    // Mark job as completed
    // @ts-ignore - result type is unknown from processor
    domainJob.complete(result);
    await this.jobRepository.save(domainJob);

    return result;
  }

  /**
   * Handle job completion.
   */
  private async handleJobCompleted(job: BullJob): Promise<void> {
    const jobId = JobId.create(job.id!);
    const domainJob = await this.jobRepository.findById(jobId);

    if (domainJob) {
      domainJob.complete(job.returnvalue);
      await this.jobRepository.save(domainJob);
    }
  }

  /**
   * Handle job failure.
   */
  private async handleJobFailed(job: BullJob, error: Error): Promise<void> {
    const jobId = JobId.create(job.id!);
    const domainJob = await this.jobRepository.findById(jobId);

    if (domainJob) {
      domainJob.fail(error.message);
      await this.jobRepository.save(domainJob);
    }
  }

  /**
   * Handle job progress update.
   */
  private async handleJobProgress(job: BullJob, progress: number): Promise<void> {
    const jobId = JobId.create(job.id!);
    const domainJob = await this.jobRepository.findById(jobId);

    if (domainJob) {
      domainJob.updateProgress(progress);
      await this.jobRepository.save(domainJob);
    }
  }

  /**
   * Get concurrency for a queue.
   */
  private async getConcurrency(queueName: string): Promise<number> {
    const queue = await this.queueRepository.findByName(queueName);
    // @ts-ignore - ValueObject typed as number
    return queue?.concurrency.value ?? 1;
  }
}
