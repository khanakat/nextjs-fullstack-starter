import { Query } from '../../base/query';

/**
 * Get Job Query
 * Query to get a single background job
 */
export class GetJobQuery extends Query {
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
