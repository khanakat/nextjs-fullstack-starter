import { Command } from '../../../../shared/application/base/command';
import { ReportConfigDto } from '../dtos/report-dto';

/**
 * Command to create a new report
 */
export class CreateReportCommand extends Command {
  public readonly title: string;
  public readonly description?: string;
  public readonly config: ReportConfigDto;
  public readonly isPublic: boolean;
  public readonly templateId?: string;
  public readonly organizationId?: string;

  constructor(
    title: string,
    config: ReportConfigDto,
    isPublic: boolean,
    userId: string,
    description?: string,
    templateId?: string,
    organizationId?: string
  ) {
    super(userId);
    this.title = title;
    this.description = description;
    this.config = config;
    this.isPublic = isPublic;
    this.templateId = templateId;
    this.organizationId = organizationId;
  }

  public validate(): void {
    super.validate();
    
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Report title is required');
    }

    if (this.title.length > 200) {
      throw new Error('Report title cannot exceed 200 characters');
    }

    if (this.description && this.description.length > 1000) {
      throw new Error('Report description cannot exceed 1000 characters');
    }

    if (!this.config) {
      throw new Error('Report configuration is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }
  }
}