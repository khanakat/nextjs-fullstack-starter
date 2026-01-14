import { BackgroundJob } from '../entities/background-job';
import { JobId } from '../value-objects/job-id';
import { JobStatus } from '../value-objects/job-status';

/**
 * Background Job Repository Interface
 * Defines the contract for background job data access
 */
export interface IBackgroundJobRepository {
  /**
   * Save a background job
   */
  save(job: BackgroundJob): Promise<void>;

  /**
   * Find a job by ID
   */
  findById(id: JobId): Promise<BackgroundJob | null>;

  /**
   * Find jobs by queue name
   */
  findByQueueName(queueName: string): Promise<BackgroundJob[]>;

  /**
   * Find jobs by status
   */
  findByStatus(status: JobStatus): Promise<BackgroundJob[]>;

  /**
   * Find jobs by queue name and status
   */
  findByQueueAndStatus(queueName: string, status: JobStatus): Promise<BackgroundJob[]>;

  /**
   * Find pending jobs for a queue
   */
  findPendingJobs(queueName: string, limit?: number): Promise<BackgroundJob[]>;

  /**
   * Find failed jobs for a queue
   */
  findFailedJobs(queueName: string, limit?: number): Promise<BackgroundJob[]>;

  /**
   * Find delayed jobs ready for retry
   */
  findDelayedJobsReadyForRetry(): Promise<BackgroundJob[]>;

  /**
   * Delete a job by ID
   */
  deleteById(id: JobId): Promise<void>;

  /**
   * Delete completed jobs older than specified date
   */
  deleteCompletedJobsOlderThan(date: Date): Promise<number>;

  /**
   * Delete failed jobs older than specified date
   */
  deleteFailedJobsOlderThan(date: Date): Promise<number>;

  /**
   * Count jobs by queue name
   */
  countByQueueName(queueName: string): Promise<number>;

  /**
   * Count jobs by status
   */
  countByStatus(status: JobStatus): Promise<number>;

  /**
   * Get job statistics for a queue
   */
  getQueueStatistics(queueName: string): Promise<{
    total: number;
    pending: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;
}
