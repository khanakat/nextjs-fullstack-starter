import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowTask } from '../../domain/entities/workflow-task';
import { WorkflowTaskId } from '../../domain/value-objects/workflow-task-id';
import { CompleteWorkflowTaskCommand } from '../commands/complete-task-command';
import type { IWorkflowTaskRepository } from '../../domain/repositories/workflow-task-repository';
import { WorkflowTaskDto } from '../dtos/workflow-task-dto';

/**
 * Complete Workflow Task Handler
 * Handles completing workflow tasks
 */
@injectable()
export class CompleteWorkflowTaskHandler extends CommandHandler<CompleteWorkflowTaskCommand, WorkflowTaskDto> {
  constructor(
    @inject('WorkflowTaskRepository') private taskRepository: IWorkflowTaskRepository
  ) {
    super();
  }

  async handle(command: CompleteWorkflowTaskCommand): Promise<Result<WorkflowTaskDto>> {
    const task = await this.taskRepository.findById(
      WorkflowTaskId.fromValue(command.props.taskId)
    );

    if (!task) {
      return Result.failure<WorkflowTaskDto>(new Error('Workflow task not found'));
    }

    // Complete the task with the provided result
    const resultJson = command.props.result ? JSON.stringify(command.props.result) : undefined;
    task.complete(command.userId || 'system', resultJson);

    // Save updated task
    await this.taskRepository.save(task);

    return Result.success(this.toDto(task));
  }

  private toDto(task: WorkflowTask): WorkflowTaskDto {
    const persistence = task.toPersistence();
    return new WorkflowTaskDto({
      id: persistence.id,
      instanceId: persistence.instanceId,
      stepId: persistence.stepId,
      name: persistence.name,
      description: persistence.description,
      taskType: persistence.taskType,
      status: persistence.status,
      priority: persistence.priority,
      assigneeId: persistence.assigneeId,
      assignedBy: persistence.assignedBy,
      assignmentType: persistence.assignmentType,
      formData: persistence.formData,
      attachments: persistence.attachments,
      comments: persistence.comments,
      assignedAt: persistence.assignedAt,
      startedAt: persistence.startedAt,
      completedAt: persistence.completedAt,
      dueDate: persistence.dueDate,
      slaHours: persistence.slaHours,
      slaDeadline: persistence.slaDeadline,
      result: persistence.result,
      completedBy: persistence.completedBy,
      rejectedBy: persistence.rejectedBy,
      rejectionReason: persistence.rejectionReason,
      createdAt: persistence.createdAt,
      updatedAt: new Date(),
    });
  }
}
