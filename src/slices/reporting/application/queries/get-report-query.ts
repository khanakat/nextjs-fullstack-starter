import { Query } from '../../../../shared/application/base/query';

/**
 * Query to get a single report by ID
 */
export class GetReportQuery extends Query {
  public readonly reportId: string;

  // Support both signature styles used in tests and application code
  constructor(input: { id: string; userId?: string } | string, userId?: string) {
    if (typeof input === 'string') {
      super(userId);
      this.reportId = input;
    } else {
      super(input.userId);
      this.reportId = input.id;
    }
  }

  public validate(): void {
    super.validate();
    
    if (!this.reportId || String(this.reportId).trim().length === 0) {
      throw new Error('Report ID is required');
    }
  }
}