import { Command } from '../../../../shared/application/base/command';
import { TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { ReportConfigDto } from '../dtos/report-dto';

/**
 * Command to create a new report template
 */
export class CreateTemplateCommand extends Command {
  public readonly name: string;
  public readonly description?: string;
  public readonly type: TemplateType;
  public readonly category: TemplateCategory;
  public readonly config: ReportConfigDto;
  public readonly tags: string[];
  public readonly previewImageUrl?: string;
  public readonly organizationId?: string;

  constructor(
    name: string,
    type: TemplateType,
    category: TemplateCategory,
    config: ReportConfigDto,
    tags: string[],
    userId: string,
    description?: string,
    previewImageUrl?: string,
    organizationId?: string
  ) {
    super(userId);
    this.name = name;
    this.description = description;
    this.type = type;
    this.category = category;
    this.config = config;
    this.tags = tags;
    this.previewImageUrl = previewImageUrl;
    this.organizationId = organizationId;
  }

  public validate(): void {
    super.validate();
    
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (this.name.length > 255) {
      throw new Error('Template name cannot exceed 255 characters');
    }

    if (this.description && this.description.length > 1000) {
      throw new Error('Template description cannot exceed 1000 characters');
    }

    if (!this.type) {
      throw new Error('Template type is required');
    }

    if (!this.category) {
      throw new Error('Template category is required');
    }

    if (!this.config) {
      throw new Error('Template configuration is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    if (!Array.isArray(this.tags)) {
      throw new Error('Tags must be an array');
    }

    if (this.tags.length > 10) {
      throw new Error('Template cannot have more than 10 tags');
    }

    // Validate each tag
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