import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowInstance } from '../../domain/entities/workflow-instance';
import { WorkflowInstanceId } from '../../domain/value-objects/workflow-instance-id';
import { CreateWorkflowInstanceCommand } from '../commands/create-instance-command';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance-repository';
import { WorkflowInstanceDto } from '../dtos/workflow-instance-dto';

/**
 * Create Workflow Instance Handler
 * Handles the creation of new workflow instances
 */
@injectable()
export class CreateWorkflowInstanceHandler extends CommandHandler<CreateWorkflowInstanceCommand, WorkflowInstanceDto> {
  constructor(
    @inject('WorkflowInstanceRepository') private instanceRepository: IWorkflowInstanceRepository
  ) {
    super();
  }

  async handle(command: CreateWorkflowInstanceCommand): Promise<Result<WorkflowInstanceDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<WorkflowInstanceDto>(new Error(validationResult.errors.join(', ')));
    }

    // Create workflow instance entity
    const instance = WorkflowInstance.create({
      workflowId: command.props.workflowId,
      status: 'running' as any,
      data: command.props.data || '{}',
      variables: command.props.variables || '{}',
      context: '{}',
      triggeredBy: command.props.triggeredBy || command.userId || 'system',
      triggerType: command.props.triggerType || 'manual' as any,
      triggerData: command.props.triggerData || '{}',
      startedAt: new Date(),
      retryCount: 0,
      priority: command.props.priority || 'normal' as any,
      slaDeadline: command.props.slaDeadline,
    });

    // Save instance
    await this.instanceRepository.save(instance);

    // Return DTO
    return Result.success(this.toDto(instance));
  }

  private validate(command: CreateWorkflowInstanceCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.workflowId || command.props.workflowId.trim() === '') {
      errors.push('Workflow ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
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
