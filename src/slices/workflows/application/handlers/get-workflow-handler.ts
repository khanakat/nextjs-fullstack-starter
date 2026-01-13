import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { Workflow } from '../../domain/entities/workflow';
import { WorkflowId } from '../../domain/value-objects/workflow-id';
import { GetWorkflowQuery } from '../queries/get-workflow-query';
import type { IWorkflowRepository } from '../../domain/repositories/workflow-repository';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Get Workflow Handler
 * Handles retrieval of a single workflow by ID
 */
@injectable()
export class GetWorkflowHandler extends QueryHandler<GetWorkflowQuery, WorkflowDto> {
  constructor(
    @inject('WorkflowRepository') private workflowRepository: IWorkflowRepository
  ) {
    super();
  }

  async handle(query: GetWorkflowQuery): Promise<Result<WorkflowDto>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<WorkflowDto>(new Error(validationResult.errors.join(', ')));
    }

    // Find workflow by ID
    const workflowId = WorkflowId.fromValue(query.props.workflowId);
    const workflow = await this.workflowRepository.findById(workflowId);

    if (!workflow) {
      return Result.failure<WorkflowDto>(new Error('Workflow not found'));
    }

    // Return DTO
    return Result.success(this.toDto(workflow));
  }

  private validate(query: GetWorkflowQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.props.workflowId || query.props.workflowId.trim() === '') {
      errors.push('Workflow ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(workflow: Workflow): WorkflowDto {
    const persistence = workflow.toPersistence();
    return new WorkflowDto({
      id: persistence.id as string,
      name: workflow.name,
      description: workflow.description ?? '',
      organizationId: workflow.organizationId ?? '',
      definition: workflow.definition,
      settings: workflow.settings,
      variables: workflow.variables,
      status: workflow.status,
      version: workflow.version,
      isTemplate: workflow.isTemplate,
      isPublic: workflow.isPublic,
      publishedAt: null,
      executionCount: 0,
      successRate: 0,
      avgDuration: 0,
      lastExecutedAt: null,
      createdBy: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
