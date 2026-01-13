import { Command } from '../../../../shared/application/base/command';

/**
 * Command to delete a scheduled report
 */
export class DeleteScheduledReportCommand extends Command {
  public readonly scheduledReportId: string;
  public readonly permanent: boolean;

  constructor(
    scheduledReportId: string,
    userId: string,
    permanent: boolean = false
  ) {
    super(userId);
    this.scheduledReportId = scheduledReportId;
    this.permanent = permanent;
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