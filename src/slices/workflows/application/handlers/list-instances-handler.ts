import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { ListWorkflowInstancesQuery } from '../queries/list-instances-query';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance-repository';
import { WorkflowInstanceDto } from '../dtos/workflow-instance-dto';

/**
 * List Workflow Instances Handler
 * Handles retrieving workflow instances with filtering and pagination
 */
@injectable()
export class ListWorkflowInstancesHandler extends QueryHandler<
  ListWorkflowInstancesQuery,
  { instances: WorkflowInstanceDto[]; total: number }
> {
  constructor(
    @inject('WorkflowInstanceRepository') private instanceRepository: IWorkflowInstanceRepository
  ) {
    super();
  }

  async handle(
    query: ListWorkflowInstancesQuery
  ): Promise<Result<{ instances: WorkflowInstanceDto[]; total: number }>> {
    const result = await this.instanceRepository.findAll({
      workflowId: query.props.workflowId,
      status: query.props.status,
      organizationId: query.props.organizationId,
      triggeredBy: query.props.triggeredBy,
      priority: query.props.priority,
      limit: query.props.limit,
      offset: query.props.offset,
      sortBy: query.props.sortBy,
      sortOrder: query.props.sortOrder,
    });

    const instances = result.instances.map((instance) => this.toDto(instance));

    return Result.success({
      instances,
      total: result.total,
    });
  }

  private toDto(instance: any): WorkflowInstanceDto {
    const persistence = instance.toPersistence();
    return new WorkflowInstanceDto({
      id: persistence.id,
      workflowId: persistence.workflowId,
      status: persistence.status,
      currentStepId: persistence.currentStepId,
      data: persistence.data,
      variables: persistence.variables,
      context: persistence.context,
      triggeredBy: persistence.triggeredBy,
      triggerType: persistence.triggerType,
      triggerData: persistence.triggerData,
      startedAt: persistence.startedAt,
      completedAt: persistence.completedAt,
      pausedAt: persistence.pausedAt,
      duration: persistence.duration,
      errorMessage: persistence.errorMessage,
      errorStep: persistence.errorStep,
      retryCount: persistence.retryCount,
      priority: persistence.priority,
      slaDeadline: persistence.slaDeadline,
      createdAt: persistence.startedAt,
      updatedAt: new Date(),
    });
  }
}
