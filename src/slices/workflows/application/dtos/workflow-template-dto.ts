import { Dto } from '../../../../shared/application/base/dto';

/**
 * WorkflowTemplateDto
 * Data Transfer Object for workflow template
 */
export class WorkflowTemplateDto extends Dto {
  readonly workflowId: string | undefined;
  readonly name: string;
  readonly description: string | undefined;
  readonly category: string;
  readonly template: string;
  readonly variables: string;
  readonly settings: string;
  readonly isBuiltIn: boolean;
  readonly isPublic: boolean;
  readonly tags: string;
  readonly usageCount: number;
  readonly rating: number | undefined;
  readonly createdBy: string | undefined;
  readonly organizationId: string | undefined;

  constructor(props: {
    id: string;
    workflowId?: string;
    name: string;
    description?: string;
    category: string;
    template: string;
    variables: string;
    settings: string;
    isBuiltIn: boolean;
    isPublic: boolean;
    tags: string;
    usageCount: number;
    rating?: number;
    createdBy?: string;
    organizationId?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.workflowId = props.workflowId;
    this.name = props.name;
    this.description = props.description;
    this.category = props.category;
    this.template = props.template;
    this.variables = props.variables;
    this.settings = props.settings;
    this.isBuiltIn = props.isBuiltIn;
    this.isPublic = props.isPublic;
    this.tags = props.tags;
    this.usageCount = props.usageCount;
    this.rating = props.rating;
    this.createdBy = props.createdBy;
    this.organizationId = props.organizationId;
  }

  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      workflowId: this.workflowId ?? null,
      name: this.name,
      description: this.description ?? null,
      category: this.category,
      template: this.template,
      variables: this.variables,
      settings: this.settings,
      isBuiltIn: this.isBuiltIn,
      isPublic: this.isPublic,
      tags: this.tags,
      usageCount: this.usageCount,
      rating: this.rating ?? null,
      createdBy: this.createdBy ?? null,
      organizationId: this.organizationId ?? null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
    };
  }
}
