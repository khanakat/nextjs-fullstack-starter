import { injectable } from 'inversify';
import { IJobQueueRepository } from '../../../domain/background-jobs/repositories/job-queue-repository';
import { JobQueue } from '../../../domain/background-jobs/entities/job-queue';
import { UniqueId } from '../../../domain/value-objects/unique-id';

/**
 * Prisma implementation of IJobQueueRepository.
 * This repository stores job queues in database.
 * 
 * NOTE: This is a placeholder implementation. The actual Prisma client
 * needs to be regenerated after schema changes. The repository interface
 * defines the contract that should be implemented.
 */
@injectable()
export class PrismaJobQueueRepository implements IJobQueueRepository {
  // TODO: Implement with actual Prisma client after schema migration
  private queues: Map<string, JobQueue> = new Map();

  async save(queue: JobQueue): Promise<void> {
    this.queues.set(queue.name, queue);
  }

  async findById(id: UniqueId): Promise<JobQueue | null> {
    return Array.from(this.queues.values()).find(
      (q) => q.id.getValue() === id.getValue()
    ) || null;
  }

  async findByName(name: string): Promise<JobQueue | null> {
    return Array.from(this.queues.values()).find(
      (q) => q.name === name
    ) || null;
  }

  async findAll(): Promise<JobQueue[]> {
    return Array.from(this.queues.values());
  }

  async findActive(): Promise<JobQueue[]> {
    return Array.from(this.queues.values()).filter((q) => q.isActive);
  }

  async findPaused(): Promise<JobQueue[]> {
    return Array.from(this.queues.values()).filter((q) => q.isPaused);
  }

  async deleteById(id: UniqueId): Promise<void> {
    for (const [name, queue] of this.queues.entries()) {
      if (queue.id.getValue() === id.getValue()) {
        this.queues.delete(name);
        break;
      }
    }
  }

  async deleteByName(name: string): Promise<void> {
    this.queues.delete(name);
  }

  async existsByName(name: string): Promise<boolean> {
    return this.queues.has(name);
  }

  async count(): Promise<number> {
    return this.queues.size;
  }

  async countActive(): Promise<number> {
    return Array.from(this.queues.values()).filter((q) => q.isActive).length;
  }

  async getGlobalStatistics(): Promise<{
    totalQueues: number;
    activeQueues: number;
    pausedQueues: number;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
  }> {
    const queues = Array.from(this.queues.values());
    const activeQueues = queues.filter((q) => q.isActive);
    const pausedQueues = queues.filter((q) => q.isPaused);

    return {
      totalQueues: queues.length,
      activeQueues: activeQueues.length,
      pausedQueues: pausedQueues.length,
      totalJobs: queues.reduce((sum, q) => sum + q.jobCount, 0),
      completedJobs: queues.reduce((sum, q) => sum + q.completedCount, 0),
      failedJobs: queues.reduce((sum, q) => sum + q.failedCount, 0),
      pendingJobs: queues.reduce((sum, q) => sum + q.pendingCount, 0),
    };
  }
}
