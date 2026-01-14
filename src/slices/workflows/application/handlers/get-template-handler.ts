import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowTemplate } from '../../domain/entities/workflow-template';
import { GetWorkflowTemplateQuery } from '../queries/get-template-query';
import type { IWorkflowTemplateRepository } from '../../domain/repositories/workflow-template-repository';
import { WorkflowTemplateDto } from '../dtos/workflow-template-dto';
import { WorkflowTemplateId } from '../../domain/value-objects/workflow-template-id';

/**
 * Get Workflow Template Handler
 * Handles retrieving a single workflow template by ID
 */
@injectable()
export class GetWorkflowTemplateHandler extends QueryHandler<GetWorkflowTemplateQuery, WorkflowTemplateDto> {
  constructor(
    @inject('WorkflowTemplateRepository') private templateRepository: IWorkflowTemplateRepository
  ) {
    super();
  }

  async handle(query: GetWorkflowTemplateQuery): Promise<Result<WorkflowTemplateDto>> {
    const template = await this.templateRepository.findById(
      WorkflowTemplateId.fromValue(query.props.templateId)
    );

    if (!template) {
      return Result.failure<WorkflowTemplateDto>(new Error('Workflow template not found'));
    }

    return Result.success(this.toDto(template));
  }

  private toDto(template: WorkflowTemplate): WorkflowTemplateDto {
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
