import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowInstance } from '../../domain/entities/workflow-instance';
import { GetWorkflowInstanceQuery } from '../queries/get-instance-query';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance-repository';
import { WorkflowInstanceDto } from '../dtos/workflow-instance-dto';
import { WorkflowInstanceId } from '../../domain/value-objects/workflow-instance-id';

/**
 * Get Workflow Instance Handler
 * Handles retrieving a single workflow instance by ID
 */
@injectable()
export class GetWorkflowInstanceHandler extends QueryHandler<GetWorkflowInstanceQuery, WorkflowInstanceDto> {
  constructor(
    @inject('WorkflowInstanceRepository') private instanceRepository: IWorkflowInstanceRepository
  ) {
    super();
  }

  async handle(query: GetWorkflowInstanceQuery): Promise<Result<WorkflowInstanceDto>> {
    const instance = await this.instanceRepository.findById(
      WorkflowInstanceId.fromValue(query.props.instanceId)
    );

    if (!instance) {
      return Result.failure<WorkflowInstanceDto>(new Error('Workflow instance not found'));
    }

    return Result.success(this.toDto(instance));
  }

  private toDto(instance: WorkflowInstance): WorkflowInstanceDto {
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
