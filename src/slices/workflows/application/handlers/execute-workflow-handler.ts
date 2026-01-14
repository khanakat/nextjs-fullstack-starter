import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowInstance } from '../../domain/entities/workflow-instance';
import { WorkflowInstanceId } from '../../domain/value-objects/workflow-instance-id';
import { TriggerType } from '../../domain/entities/workflow-instance';
import { ExecuteWorkflowCommand } from '../commands/execute-workflow-command';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance-repository';
import { WorkflowInstanceDto } from '../dtos/workflow-instance-dto';

/**
 * Execute Workflow Handler
 * Handles executing workflows by creating instances and processing them
 */
@injectable()
export class ExecuteWorkflowHandler extends CommandHandler<ExecuteWorkflowCommand, WorkflowInstanceDto> {
  constructor(
    @inject('WorkflowInstanceRepository') private instanceRepository: IWorkflowInstanceRepository
  ) {
    super();
  }

  async handle(command: ExecuteWorkflowCommand): Promise<Result<WorkflowInstanceDto>> {
    // Create workflow instance
    const instance = WorkflowInstance.create({
      workflowId: command.props.workflowId,
      status: 'running' as any,
      currentStepId: '', // Will be determined by workflow definition
      data: JSON.stringify(command.props.inputs || {}),
      variables: JSON.stringify(command.props.variables || {}),
      context: '{}',
      triggeredBy: command.props.triggeredBy || command.userId || 'system',
      triggerType: TriggerType.MANUAL,
      triggerData: '{}',
      priority: command.props.priority || 'normal' as any,
      slaDeadline: undefined,
      errorMessage: undefined,
      errorStep: undefined,
      retryCount: 0,
      startedAt: new Date(),
      completedAt: undefined,
      pausedAt: undefined,
      duration: undefined,
    });

    // Save the instance
    await this.instanceRepository.save(instance);

    // TODO: Process workflow instance through its steps
    // This would involve the step processor logic from the legacy service
    // For now, we create the instance in running state

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
