import { Query } from '../../../../shared/application/base/query';

/**
 * Query to get a single scheduled report by ID
 */
export class GetScheduledReportQuery extends Query {
  public readonly scheduledReportId: string;

  constructor(scheduledReportId: string, userId?: string) {
    super(userId);
    this.scheduledReportId = scheduledReportId;
  }

  public validate(): void {
    super.validate();
    
    if (!this.scheduledReportId || this.scheduledReportId.trim().length === 0) {
      throw new Error('Scheduled report ID is required');
    }
  }
}