import { Dto } from '../../../../shared/application/base/dto';

/**
 * Dashboard DTO
 * Data transfer object for dashboard information
 */
export class DashboardDto extends Dto {
  readonly name: string;
  readonly description?: string;
  readonly layout: string;
  readonly settings: string;
  readonly isPublic: boolean;
  readonly isTemplate: boolean;
  readonly tags: string;
  readonly organizationId?: string;
  readonly createdBy: string;
  readonly status: string;
  readonly lastViewedAt?: Date;
  readonly viewCount: number;

  constructor(
    id: string,
    createdAt: Date,
    props: {
      name: string;
      description?: string;
      layout: string;
      settings: string;
      isPublic: boolean;
      isTemplate: boolean;
      tags: string;
      organizationId?: string;
      createdBy: string;
      status: string;
      lastViewedAt?: Date;
      viewCount: number;
    }
  ) {
    super(id, createdAt);
    this.name = props.name;
    this.description = props.description;
    this.layout = props.layout;
    this.settings = props.settings;
    this.isPublic = props.isPublic;
    this.isTemplate = props.isTemplate;
    this.tags = props.tags;
    this.organizationId = props.organizationId;
    this.createdBy = props.createdBy;
    this.status = props.status;
    this.lastViewedAt = props.lastViewedAt;
    this.viewCount = props.viewCount;
  }

  toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      layout: this.layout,
      settings: this.settings,
      isPublic: this.isPublic,
      isTemplate: this.isTemplate,
      tags: this.tags,
      organizationId: this.organizationId,
      createdBy: this.createdBy,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastViewedAt: this.lastViewedAt,
      viewCount: this.viewCount,
    };
  }
}
