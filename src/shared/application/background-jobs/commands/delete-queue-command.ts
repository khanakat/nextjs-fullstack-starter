import { Command } from '../../base/command';

/**
 * Delete Queue Command
 * Command to delete a job queue
 */
export class DeleteQueueCommand extends Command {
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
