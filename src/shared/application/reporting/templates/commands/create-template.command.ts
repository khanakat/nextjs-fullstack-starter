import { Command } from '../../../base/command';
import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../domain/reporting/entities/report-template';
import { ReportConfig } from '../../../../domain/reporting/value-objects/report-config';

/**
 * Create Report Template Command
 * Command to create a new report template
 */
export class CreateTemplateCommand extends Command {
  readonly name: string;
  readonly description?: string;
  readonly type: TemplateType;
  readonly category: TemplateCategory;
  readonly config: ReportConfig;
  readonly layout?: any;
  readonly styling?: any;
  readonly isPublic?: boolean;
  readonly tags?: string[];
  readonly createdBy: string;
  readonly organizationId?: string;

  constructor(props: {
    name: string;
    description?: string;
    type?: TemplateType;
    category?: TemplateCategory;
    config: any;
    layout?: any;
    styling?: any;
    isPublic?: boolean;
    tags?: string[];
    createdBy: string;
    organizationId?: string;
  }) {
    super(props.createdBy);
    this.name = props.name;
    this.description = props.description;
    this.type = props.type || TemplateType.CUSTOM;
    this.category = props.category || TemplateCategory.STANDARD;
    this.config = props.config instanceof ReportConfig
      ? props.config
      : ReportConfig.create(props.config || { title: props.name });
    this.layout = props.layout;
    this.styling = props.styling;
    this.isPublic = props.isPublic ?? true;
    this.tags = props.tags || [];
    this.createdBy = props.createdBy;
    this.organizationId = props.organizationId;
  }

  public validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (this.name.length > 100) {
      throw new Error('Template name cannot exceed 100 characters');
    }

    if (!this.config) {
      throw new Error('Template config is required');
    }
  }
}
