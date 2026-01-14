import { Command } from '../../base/command';

/**
 * Delete Job Command
 * Command to delete a background job
 */
export class DeleteJobCommand extends Command {
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
