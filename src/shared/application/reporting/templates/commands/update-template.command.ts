import { Command } from '../../../base/command';
import { TemplateType, TemplateCategory } from '../../../../domain/reporting/entities/report-template';
import { ReportConfig } from '../../../../domain/reporting/value-objects/report-config';

/**
 * Update Report Template Command
 * Command to update an existing report template
 */
export class UpdateTemplateCommand extends Command {
  readonly templateId: string;
  readonly name?: string;
  readonly description?: string;
  readonly type?: TemplateType;
  readonly category?: TemplateCategory;
  readonly config?: any;
  readonly layout?: any;
  readonly styling?: any;
  readonly isPublic?: boolean;
  readonly isActive?: boolean;
  readonly tags?: string[];
  readonly userId: string;

  constructor(props: {
    templateId: string;
    name?: string;
    description?: string;
    type?: TemplateType;
    category?: TemplateCategory;
    config?: any;
    layout?: any;
    styling?: any;
    isPublic?: boolean;
    isActive?: boolean;
    tags?: string[];
    userId: string;
  }) {
    super(props.userId);
    this.templateId = props.templateId;
    this.name = props.name;
    this.description = props.description;
    this.type = props.type;
    this.category = props.category;
    this.config = props.config;
    this.layout = props.layout;
    this.styling = props.styling;
    this.isPublic = props.isPublic;
    this.isActive = props.isActive;
    this.tags = props.tags;
    this.userId = props.userId;
  }

  public validate(): void {
    if (!this.templateId) {
      throw new Error('Template ID is required');
    }

    if (this.name !== undefined && this.name.length > 100) {
      throw new Error('Template name cannot exceed 100 characters');
    }
  }
}
