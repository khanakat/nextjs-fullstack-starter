import { Query } from '../../base/query';

/**
 * Get Queues Query
 * Query to get all job queues
 */
export class GetQueuesQuery extends Query {
  constructor(
    public readonly activeOnly: boolean = false,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    // No validation required
  }
}
