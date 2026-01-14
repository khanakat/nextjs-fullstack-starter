import { Command } from '../../base/command';

/**
 * Retry Job Command
 * Command to retry a failed job
 */
export class RetryJobCommand extends Command {
  constructor(
    public readonly jobId: string,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.jobId || this.jobId.trim().length === 0) {
      throw new Error('Job ID is required');
    }
  }
}
