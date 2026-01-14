import { JobQueue } from '../entities/job-queue';
import { UniqueId } from '../../value-objects/unique-id';

/**
 * Job Queue Repository Interface
 * Defines the contract for job queue data access
 */
export interface IJobQueueRepository {
  /**
   * Save a job queue
   */
  save(queue: JobQueue): Promise<void>;

  /**
   * Find a queue by ID
   */
  findById(id: UniqueId): Promise<JobQueue | null>;

  /**
   * Find a queue by name
   */
  findByName(name: string): Promise<JobQueue | null>;

  /**
   * Find all queues
   */
  findAll(): Promise<JobQueue[]>;

  /**
   * Find active queues
   */
  findActive(): Promise<JobQueue[]>;

  /**
   * Find paused queues
   */
  findPaused(): Promise<JobQueue[]>;

  /**
   * Delete a queue by ID
   */
  deleteById(id: UniqueId): Promise<void>;

  /**
   * Delete a queue by name
   */
  deleteByName(name: string): Promise<void>;

  /**
   * Check if a queue exists by name
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Count all queues
   */
  count(): Promise<number>;

  /**
   * Count active queues
   */
  countActive(): Promise<number>;

  /**
   * Get global statistics
   */
  getGlobalStatistics(): Promise<{
    totalQueues: number;
    activeQueues: number;
    pausedQueues: number;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
  }>;
}
