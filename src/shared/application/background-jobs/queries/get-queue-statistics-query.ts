import { Query } from '../../base/query';

/**
 * Get Queue Statistics Query
 * Query to get statistics for a job queue
 */
export class GetQueueStatisticsQuery extends Query {
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
