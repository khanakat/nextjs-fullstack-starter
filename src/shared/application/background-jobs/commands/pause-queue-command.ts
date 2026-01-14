import { Command } from '../../base/command';

/**
 * Pause Queue Command
 * Command to pause a job queue
 */
export class PauseQueueCommand extends Command {
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
