import { Query } from '../../base/query';

/**
 * Get Jobs By Queue Query
 * Query to get jobs for a specific queue
 */
export class GetJobsByQueueQuery extends Query {
  constructor(
    public readonly queueName: string,
    public readonly limit?: number,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.queueName || this.queueName.trim().length === 0) {
      throw new Error('Queue name is required');
    }
    if (this.limit !== undefined && this.limit < 1) {
      throw new Error('Limit must be at least 1');
    }
  }
}
