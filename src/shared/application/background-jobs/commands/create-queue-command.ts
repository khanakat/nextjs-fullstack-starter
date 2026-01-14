import { Command } from '../../base/command';
import { JobPriority } from '../../../domain/background-jobs/value-objects/job-priority';

/**
 * Create Queue Command
 * Command to create a new job queue
 */
export class CreateQueueCommand extends Command {
  constructor(
    public readonly name: string,
    public readonly description?: string,
    public readonly defaultPriority: JobPriority = JobPriority.normal(),
    public readonly concurrency: number = 5,
    public readonly maxRetries: number = 3,
    public readonly defaultTimeout?: number,
    public readonly defaultDelay?: number,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Queue name is required');
    }
    if (this.concurrency < 1) {
      throw new Error('Concurrency must be at least 1');
    }
    if (this.maxRetries < 0) {
      throw new Error('Max retries cannot be negative');
    }
    if (this.defaultTimeout !== undefined && this.defaultTimeout < 0) {
      throw new Error('Default timeout cannot be negative');
    }
    if (this.defaultDelay !== undefined && this.defaultDelay < 0) {
      throw new Error('Default delay cannot be negative');
    }
  }
}
