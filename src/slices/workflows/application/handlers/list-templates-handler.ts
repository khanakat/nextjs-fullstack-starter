import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { ListWorkflowTemplatesQuery } from '../queries/list-templates-query';
import type { IWorkflowTemplateRepository } from '../../domain/repositories/workflow-template-repository';
import { WorkflowTemplateDto } from '../dtos/workflow-template-dto';

/**
 * List Workflow Templates Handler
 * Handles retrieving workflow templates with filtering and pagination
 */
@injectable()
export class ListWorkflowTemplatesHandler extends QueryHandler<
  ListWorkflowTemplatesQuery,
  { templates: WorkflowTemplateDto[]; total: number }
> {
  constructor(
    @inject('WorkflowTemplateRepository') private templateRepository: IWorkflowTemplateRepository
  ) {
    super();
  }

  async handle(
    query: ListWorkflowTemplatesQuery
  ): Promise<Result<{ templates: WorkflowTemplateDto[]; total: number }>> {
    const result = await this.templateRepository.findAll({
      workflowId: query.props.workflowId,
      organizationId: query.props.organizationId,
      category: query.props.category,
      isBuiltIn: query.props.isBuiltIn,
      isPublic: query.props.isPublic,
      search: query.props.search,
      tags: query.props.tags,
      createdBy: query.props.createdBy,
      minUsageCount: query.props.minUsageCount,
      minRating: query.props.minRating,
      limit: query.props.limit,
      offset: query.props.offset,
      sortBy: query.props.sortBy,
      sortOrder: query.props.sortOrder,
    });

    const templates = result.templates.map((template) => this.toDto(template));

    return Result.success({
      templates,
      total: result.total,
    });
  }

  private toDto(template: any): WorkflowTemplateDto {
    const persistence = template.toPersistence();
    return new WorkflowTemplateDto({
      id: persistence.id,
      workflowId: persistence.workflowId,
      name: persistence.name,
      description: persistence.description,
      category: persistence.category,
      template: persistence.template,
      variables: persistence.variables,
      settings: persistence.settings,
      isBuiltIn: persistence.isBuiltIn,
      isPublic: persistence.isPublic,
      tags: persistence.tags,
      usageCount: persistence.usageCount,
      rating: persistence.rating,
      createdBy: persistence.createdBy,
      organizationId: persistence.organizationId,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    });
  }
}
