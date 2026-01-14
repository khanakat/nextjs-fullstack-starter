import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowInstance, WorkflowInstanceStatus } from '../../domain/entities/workflow-instance';
import { WorkflowInstanceId } from '../../domain/value-objects/workflow-instance-id';
import { UpdateWorkflowInstanceCommand } from '../commands/update-instance-command';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance-repository';
import { WorkflowInstanceDto } from '../dtos/workflow-instance-dto';

/**
 * Perform Workflow Action Handler
 * Handles performing actions on workflow instances (pause, resume, cancel, etc.)
 */
@injectable()
export class PerformWorkflowActionHandler extends CommandHandler<UpdateWorkflowInstanceCommand, WorkflowInstanceDto> {
  constructor(
    @inject('WorkflowInstanceRepository') private instanceRepository: IWorkflowInstanceRepository
  ) {
    super();
  }

  async handle(command: UpdateWorkflowInstanceCommand): Promise<Result<WorkflowInstanceDto>> {
    const instance = await this.instanceRepository.findById(
      WorkflowInstanceId.fromValue(command.props.instanceId)
    );

    if (!instance) {
      return Result.failure<WorkflowInstanceDto>(new Error('Workflow instance not found'));
    }

    // Update instance data first if provided
    if (command.props.data !== undefined) {
      instance.updateData(command.props.data);
    }

    if (command.props.variables !== undefined) {
      instance.updateVariables(command.props.variables);
    }

    // Perform action based on currentStepId (which represents the action)
    if (command.props.currentStepId) {
      const action = command.props.currentStepId;

      switch (action) {
        case 'pause':
          instance.pause();
          break;
        case 'resume':
          instance.resume();
          break;
        case 'cancel':
          instance.cancel();
          break;
        case 'complete':
          if (instance.isRunning() || instance.isPaused()) {
            instance.complete();
          }
          break;
        case 'fail':
          // Fail with error message from data
          const data = JSON.parse(instance.getDataAsObject());
          instance.fail(data.errorMessage || 'Unknown error', data.errorStep);
          break;
        default:
          return Result.failure<WorkflowInstanceDto>(new Error(`Unknown action: ${action}`));
      }
    }

    // Save updated instance
    await this.instanceRepository.save(instance);

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
