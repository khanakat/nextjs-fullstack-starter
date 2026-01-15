import { BackgroundJob, JobData, JobResult } from '../entities/background-job';
import { JobQueue } from '../entities/job-queue';
import { IBackgroundJobRepository } from '../repositories/background-job-repository';
import { IJobQueueRepository } from '../repositories/job-queue-repository';
import { JobId } from '../value-objects/job-id';
import { JobStatus } from '../value-objects/job-status';
import { JobPriority } from '../value-objects/job-priority';
import { UniqueId } from '../../value-objects/unique-id';

export interface JobProcessor<T = any> {
  process(job: BackgroundJob): Promise<JobResult>;
}

/**
 * Job Queue Service
 * Manages background job queues and job processing
 */
export class JobQueueService {
  constructor(
    private readonly jobRepository: IBackgroundJobRepository,
    private readonly queueRepository: IJobQueueRepository
  ) {}

  /**
   * Create a new job queue
   */
  async createQueue(
    name: string,
    description?: string,
    defaultPriority: JobPriority = JobPriority.normal(),
    concurrency: number = 5,
    maxRetries: number = 3,
    defaultTimeout?: number,
    defaultDelay?: number
  ): Promise<JobQueue> {
    const existingQueue = await this.queueRepository.findByName(name);
    if (existingQueue) {
      throw new Error(`Queue with name '${name}' already exists`);
    }

    const queue = new JobQueue(
      UniqueId.generate(),
      name,
      description,
      defaultPriority,
      concurrency,
      maxRetries,
      defaultTimeout,
      defaultDelay
    );

    await this.queueRepository.save(queue);
    return queue;
  }

  /**
   * Get a queue by name
   */
  async getQueue(name: string): Promise<JobQueue | null> {
    return await this.queueRepository.findByName(name);
  }

  /**
   * Get all queues
   */
  async getAllQueues(): Promise<JobQueue[]> {
    return await this.queueRepository.findAll();
  }

  /**
   * Get active queues
   */
  async getActiveQueues(): Promise<JobQueue[]> {
    return await this.queueRepository.findActive();
  }

  /**
   * Add a job to a queue
   */
  async addJob(
    queueName: string,
    jobName: string,
    data: JobData,
    priority?: JobPriority,
    delay?: number,
    timeout?: number
  ): Promise<BackgroundJob> {
    const queue = await this.queueRepository.findByName(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    if (!queue.isActive) {
      throw new Error(`Queue '${queueName}' is not active`);
    }

    const job = new BackgroundJob(
      JobId.create(UniqueId.generate().getValue()),
      jobName,
      queueName,
      data,
      priority || queue.defaultPriority,
      queue.maxRetries,
      delay || queue.defaultDelay,
      timeout || queue.defaultTimeout
    );

    await this.jobRepository.save(job);
    queue.incrementJobCount();
    await this.queueRepository.save(queue);

    return job;
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string): Promise<BackgroundJob | null> {
    const id = JobId.create(jobId);
    return await this.jobRepository.findById(id);
  }

  /**
   * Get jobs by queue
   */
  async getJobsByQueue(queueName: string): Promise<BackgroundJob[]> {
    return await this.jobRepository.findByQueueName(queueName);
  }

  /**
   * Get pending jobs for a queue
   */
  async getPendingJobs(queueName: string, limit?: number): Promise<BackgroundJob[]> {
    return await this.jobRepository.findPendingJobs(queueName, limit);
  }

  /**
   * Get failed jobs for a queue
   */
  async getFailedJobs(queueName: string, limit?: number): Promise<BackgroundJob[]> {
    return await this.jobRepository.findFailedJobs(queueName, limit);
  }

  /**
   * Process a job
   */
  async processJob(job: BackgroundJob, processor: JobProcessor): Promise<void> {
    if (!job.isRunning()) {
      job.start();
      await this.jobRepository.save(job);
    }

    try {
      const result = await processor.process(job);
      job.complete(result);
    } catch (error) {
      job.fail(error instanceof Error ? error.message : String(error));
    }

    const queue = await this.queueRepository.findByName(job.queueName);
    if (queue) {
      if (job.isCompleted()) {
        queue.incrementCompletedCount();
      } else if (job.isFailed()) {
        queue.incrementFailedCount();
      }
      await this.queueRepository.save(queue);
    }

    await this.jobRepository.save(job);
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<BackgroundJob | null> {
    const job = await this.getJob(jobId);
    if (!job) {
      return null;
    }

    if (!job.canRetry()) {
      throw new Error(`Job '${jobId}' cannot be retried. Max attempts reached.`);
    }

    job.retry();
    await this.jobRepository.save(job);
    return job;
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    const id = JobId.create(jobId);
    await this.jobRepository.deleteById(id);
  }

  /**
   * Delete completed jobs older than specified date
   */
  async deleteOldCompletedJobs(date: Date): Promise<number> {
    return await this.jobRepository.deleteCompletedJobsOlderThan(date);
  }

  /**
   * Delete failed jobs older than specified date
   */
  async deleteOldFailedJobs(date: Date): Promise<number> {
    return await this.jobRepository.deleteFailedJobsOlderThan(date);
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(queueName: string): Promise<any> {
    const queue = await this.queueRepository.findByName(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const jobStats = await this.jobRepository.getQueueStatistics(queueName);

    return {
      ...queue.getStatistics(),
      ...jobStats,
    };
  }

  /**
   * Get global statistics
   */
  async getGlobalStatistics(): Promise<any> {
    return await this.queueRepository.getGlobalStatistics();
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = await this.queueRepository.findByName(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    queue.pause();
    await this.queueRepository.save(queue);
  }

  /**
   * Resume a paused queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = await this.queueRepository.findByName(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    queue.resume();
    await this.queueRepository.save(queue);
  }

  /**
   * Activate a queue
   */
  async activateQueue(queueName: string): Promise<void> {
    const queue = await this.queueRepository.findByName(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    queue.activate();
    await this.queueRepository.save(queue);
  }

  /**
   * Deactivate a queue
   */
  async deactivateQueue(queueName: string): Promise<void> {
    const queue = await this.queueRepository.findByName(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    queue.deactivate();
    await this.queueRepository.save(queue);
  }

  /**
   * Delete a queue
   */
  async deleteQueue(queueName: string): Promise<void> {
    await this.queueRepository.deleteByName(queueName);
  }
}
