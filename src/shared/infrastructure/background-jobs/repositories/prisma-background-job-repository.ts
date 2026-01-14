import { injectable } from 'inversify';
import { IBackgroundJobRepository } from '../../../domain/background-jobs/repositories/background-job-repository';
import { BackgroundJob } from '../../../domain/background-jobs/entities/background-job';
import { JobId } from '../../../domain/background-jobs/value-objects/job-id';
import { JobStatus } from '../../../domain/background-jobs/value-objects/job-status';
import { JobPriority } from '../../../domain/background-jobs/value-objects/job-priority';

/**
 * Prisma implementation of IBackgroundJobRepository.
 * This repository stores background jobs in database.
 * 
 * NOTE: This is a placeholder implementation. The actual Prisma client
 * needs to be regenerated after schema changes. The repository interface
 * defines the contract that should be implemented.
 */
@injectable()
export class PrismaBackgroundJobRepository implements IBackgroundJobRepository {
  // TODO: Implement with actual Prisma client after schema migration
  private jobs: Map<string, BackgroundJob> = new Map();

  async save(job: BackgroundJob): Promise<void> {
    this.jobs.set(job.id.getValue(), job);
  }

  async findById(id: JobId): Promise<BackgroundJob | null> {
    return this.jobs.get(id.getValue()) || null;
  }

  async findByQueueName(queueName: string): Promise<BackgroundJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.queueName === queueName
    );
  }

  async findByStatus(status: JobStatus): Promise<BackgroundJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status.getValue() === status.getValue()
    );
  }

  async findByQueueAndStatus(
    queueName: string,
    status: JobStatus
  ): Promise<BackgroundJob[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.queueName === queueName && job.status.getValue() === status.getValue()
    );
  }

  async findPendingJobs(queueName: string, limit?: number): Promise<BackgroundJob[]> {
    let jobs = Array.from(this.jobs.values()).filter(
      (job) => job.queueName === queueName && job.status.isPending()
    );
    if (limit) {
      jobs = jobs.slice(0, limit);
    }
    return jobs;
  }

  async findFailedJobs(queueName: string, limit?: number): Promise<BackgroundJob[]> {
    let jobs = Array.from(this.jobs.values()).filter(
      (job) => job.queueName === queueName && job.status.isFailed()
    );
    if (limit) {
      jobs = jobs.slice(0, limit);
    }
    return jobs;
  }

  async findDelayedJobsReadyForRetry(): Promise<BackgroundJob[]> {
    const now = new Date();
    return Array.from(this.jobs.values()).filter(
      (job) => job.status.isDelayed() && job.nextRetryAt && job.nextRetryAt <= now
    );
  }

  async deleteById(id: JobId): Promise<void> {
    this.jobs.delete(id.getValue());
  }

  async deleteCompletedJobsOlderThan(date: Date): Promise<number> {
    let count = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (job.status.isCompleted() && job.completedAt && job.completedAt < date) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  async deleteFailedJobsOlderThan(date: Date): Promise<number> {
    let count = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (job.status.isFailed() && job.failedAt && job.failedAt < date) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  async countByQueueName(queueName: string): Promise<number> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.queueName === queueName
    ).length;
  }

  async countByStatus(status: JobStatus): Promise<number> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status.getValue() === status.getValue()
    ).length;
  }

  async getQueueStatistics(queueName: string): Promise<{
    total: number;
    pending: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const jobs = Array.from(this.jobs.values()).filter(
      (job) => job.queueName === queueName
    );

    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status.isPending()).length,
      active: jobs.filter((j) => j.status.isActive()).length,
      completed: jobs.filter((j) => j.status.isCompleted()).length,
      failed: jobs.filter((j) => j.status.isFailed()).length,
      delayed: jobs.filter((j) => j.status.isDelayed()).length,
    };
  }
}
