import { Command } from '../../base/command';
import { JobPriority } from '../../../domain/background-jobs/value-objects/job-priority';
import type { JobData } from '../../../domain/background-jobs/entities/background-job';

/**
 * Create Job Command
 * Command to create a new background job
 */
export class CreateJobCommand extends Command {
  constructor(
    public readonly queueName: string,
    public readonly jobName: string,
    public readonly data: JobData,
    public readonly priority?: JobPriority,
    public readonly delay?: number,
    public readonly timeout?: number,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.queueName || this.queueName.trim().length === 0) {
      throw new Error('Queue name is required');
    }
    if (!this.jobName || this.jobName.trim().length === 0) {
      throw new Error('Job name is required');
    }
    if (!this.data) {
      throw new Error('Job data is required');
    }
    if (this.delay !== undefined && this.delay < 0) {
      throw new Error('Delay cannot be negative');
    }
    if (this.timeout !== undefined && this.timeout < 0) {
      throw new Error('Timeout cannot be negative');
    }
  }
}
