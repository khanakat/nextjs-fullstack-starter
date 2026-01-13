import { Dto } from '../../../../shared/application/base/dto';
import { WorkflowStatus } from '../../domain/entities/workflow';

/**
 * WorkflowDto
 * Data Transfer Object for workflow
 */
export class WorkflowDto extends Dto {
  readonly name: string;
  readonly description: string;
  readonly organizationId: string;
  readonly definition: string;
  readonly settings: string;
  readonly variables: string;
  readonly status: WorkflowStatus;
  readonly version: string;
  readonly isTemplate: boolean;
  readonly isPublic: boolean;
  readonly publishedAt: Date | null;
  readonly executionCount: number;
  readonly successRate: number;
  readonly avgDuration: number;
  readonly lastExecutedAt: Date | null;
  readonly createdBy: string;

  constructor(props: {
    id: string;
    name: string;
    description: string;
    organizationId: string;
    definition: string;
    settings: string;
    variables: string;
    status: WorkflowStatus;
    version: string;
    isTemplate: boolean;
    isPublic: boolean;
    publishedAt: Date | null;
    executionCount: number;
    successRate: number;
    avgDuration: number;
    lastExecutedAt: Date | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.description = props.description;
    this.organizationId = props.organizationId;
    this.definition = props.definition;
    this.settings = props.settings;
    this.variables = props.variables;
    this.status = props.status;
    this.version = props.version;
    this.isTemplate = props.isTemplate;
    this.isPublic = props.isPublic;
    this.publishedAt = props.publishedAt;
    this.executionCount = props.executionCount;
    this.successRate = props.successRate;
    this.avgDuration = props.avgDuration;
    this.lastExecutedAt = props.lastExecutedAt;
    this.createdBy = props.createdBy;
  }

  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      organizationId: this.organizationId,
      definition: this.definition,
      settings: this.settings,
      variables: this.variables,
      status: this.status,
      version: this.version,
      isTemplate: this.isTemplate,
      isPublic: this.isPublic,
      publishedAt: this.publishedAt?.toISOString() ?? null,
      executionCount: this.executionCount,
      successRate: this.successRate,
      avgDuration: this.avgDuration,
      lastExecutedAt: this.lastExecutedAt?.toISOString() ?? null,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
    };
  }
}
