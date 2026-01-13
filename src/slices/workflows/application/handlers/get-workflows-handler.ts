import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { Workflow } from '../../domain/entities/workflow';
import { GetWorkflowsQuery } from '../queries/get-workflows-query';
import type { IWorkflowRepository } from '../../domain/repositories/workflow-repository';
import { WorkflowDto } from '../dtos/workflow-dto';

/**
 * Get Workflows Handler
 * Handles retrieval of multiple workflows with filters
 */
@injectable()
export class GetWorkflowsHandler extends QueryHandler<GetWorkflowsQuery, WorkflowDto[]> {
  constructor(
    @inject('WorkflowRepository') private workflowRepository: IWorkflowRepository
  ) {
    super();
  }

  async handle(query: GetWorkflowsQuery): Promise<Result<WorkflowDto[]>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<WorkflowDto[]>(new Error(validationResult.errors.join(', ')));
    }

    // Get workflows based on filters
    let workflows: Workflow[] = [];

    if (query.props.organizationId) {
      // Get workflows by organization
      workflows = await this.workflowRepository.findByOrganizationId(query.props.organizationId);
    } else if (query.props.status) {
      // Get workflows by status
      workflows = await this.workflowRepository.findByStatus(query.props.status);
    } else if (query.props.isTemplate) {
      // Get workflow templates
      workflows = await this.workflowRepository.findTemplates();
    } else if (query.props.isPublic) {
      // Get public workflows
      workflows = await this.workflowRepository.findPublic();
    } else {
      // Get all workflows
      workflows = await this.workflowRepository.findAll();
    }

    // Apply client-side filters for additional conditions
    let filteredWorkflows = workflows;

    if (query.props.status) {
      filteredWorkflows = filteredWorkflows.filter(w => w.status === query.props.status);
    }

    if (query.props.isTemplate !== undefined) {
      filteredWorkflows = filteredWorkflows.filter(w => w.isTemplate === query.props.isTemplate);
    }

    if (query.props.isPublic !== undefined) {
      filteredWorkflows = filteredWorkflows.filter(w => w.isPublic === query.props.isPublic);
    }

    // Apply pagination
    const limit = query.props.limit ?? 50;
    const offset = query.props.offset ?? 0;
    const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

    // Convert to DTOs
    const dtos = paginatedWorkflows.map(w => this.toDto(w));

    return Result.success(dtos);
  }

  private validate(query: GetWorkflowsQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (query.props.limit !== undefined && query.props.limit < 1) {
      errors.push('Limit must be greater than 0');
    }

    if (query.props.limit !== undefined && query.props.limit > 100) {
      errors.push('Limit cannot exceed 100');
    }

    if (query.props.offset !== undefined && query.props.offset < 0) {
      errors.push('Offset must be greater than or equal to 0');
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
