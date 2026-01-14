import { Query } from '../../base/query';

/**
 * Get Queue Query
 * Query to get a single job queue
 */
export class GetQueueQuery extends Query {
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
