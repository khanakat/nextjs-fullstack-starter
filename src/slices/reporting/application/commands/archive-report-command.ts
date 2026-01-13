import { Command } from '../../../../shared/application/base/command';

/**
 * Command to archive a report
 */
export class ArchiveReportCommand extends Command {
  public readonly reportId: string;

  constructor(reportId: string, userId: string) {
    super(userId);
    this.reportId = reportId;
  }

  public validate(): void {
    super.validate();
    
    if (!this.reportId || this.reportId.trim().length === 0) {
      throw new Error('Report ID is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }
  }
}