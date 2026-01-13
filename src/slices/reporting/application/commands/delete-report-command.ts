import { Command } from '../../../../shared/application/base/command';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Command to delete a report
 */
export class DeleteReportCommand extends Command {
  public readonly reportId: string;
  public readonly permanent: boolean;

  constructor(reportId: string, userId: string, permanent: boolean = false) {
    super(userId);
    this.reportId = reportId;
    this.permanent = permanent;
  }

  public validate(): void {
    super.validate();
    
    if (!this.reportId || this.reportId.trim().length === 0) {
      throw new Error('Report ID is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    // Validate CUID format for IDs as tests expect explicit "Invalid" messages
    if (!UniqueId.isValid(this.reportId)) {
      throw new Error('Invalid report ID format');
    }
    if (!UniqueId.isValid(this.userId)) {
      throw new Error('Invalid user ID format');
    }
  }
}