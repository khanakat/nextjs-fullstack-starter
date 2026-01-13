import { Command } from '../../../../shared/application/base/command';
import { TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { ReportConfigDto } from '../dtos/report-dto';

/**
 * Command to update an existing report template
 */
export class UpdateTemplateCommand extends Command {
  public readonly templateId: string;
  public readonly name?: string;
  public readonly description?: string;
  public readonly category?: TemplateCategory;
  public readonly config?: ReportConfigDto;
  public readonly tags?: string[];
  public readonly previewImageUrl?: string;
  public readonly isActive?: boolean;

  constructor(
    templateId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      category?: TemplateCategory;
      config?: ReportConfigDto;
      tags?: string[];
      previewImageUrl?: string;
      isActive?: boolean;
    }
  ) {
    super(userId);
    this.templateId = templateId;
    this.name = updates.name;
    this.description = updates.description;
    this.category = updates.category;
    this.config = updates.config;
    this.tags = updates.tags;
    this.previewImageUrl = updates.previewImageUrl;
    this.isActive = updates.isActive;
  }

  public validate(): void {
    super.validate();
    
    if (!this.templateId || this.templateId.trim().length === 0) {
      throw new Error('Template ID is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    if (this.name !== undefined && this.name.trim().length === 0) {
      throw new Error('Template name cannot be empty');
    }

    if (this.name && this.name.length > 255) {
      throw new Error('Template name cannot exceed 255 characters');
    }

    if (this.description && this.description.length > 1000) {
      throw new Error('Template description cannot exceed 1000 characters');
    }

    if (this.tags) {
      if (!Array.isArray(this.tags)) {
        throw new Error('Tags must be an array');
      }

      if (this.tags.length > 10) {
        throw new Error('Template cannot have more than 10 tags');
      }

      for (const tag of this.tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('All tags must be non-empty strings');
        }
        if (tag.length > 50) {
          throw new Error('Each tag cannot exceed 50 characters');
        }
      }
    }
  }
}
