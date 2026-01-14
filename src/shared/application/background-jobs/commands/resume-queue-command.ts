import { Command } from '../../base/command';

/**
 * Resume Queue Command
 * Command to resume a paused job queue
 */
export class ResumeQueueCommand extends Command {
  constructor(
    public readonly queueName: string,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.queueName || this.queueName.trim().length === 0) {
      throw new Error('Queue name is required');
    }
  }
}
