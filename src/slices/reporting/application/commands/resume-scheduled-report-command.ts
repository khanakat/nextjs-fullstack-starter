import { Command } from '../../../../shared/application/base/command';

/**
 * Command to resume a paused scheduled report
 */
export class ResumeScheduledReportCommand extends Command {
  public readonly scheduledReportId: string;

  constructor(
    scheduledReportId: string,
    userId: string
  ) {
    super(userId);
    this.scheduledReportId = scheduledReportId;
  }

  public validate(): void {
    super.validate();
    
    if (!this.scheduledReportId || this.scheduledReportId.trim().length === 0) {
      throw new Error('Scheduled report ID is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }
  }
}