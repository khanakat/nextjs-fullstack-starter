import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowTask } from '../../domain/entities/workflow-task';
import { WorkflowTaskId } from '../../domain/value-objects/workflow-task-id';
import { UpdateWorkflowTaskCommand } from '../commands/update-task-command';
import type { IWorkflowTaskRepository } from '../../domain/repositories/workflow-task-repository';
import { WorkflowTaskDto } from '../dtos/workflow-task-dto';

/**
 * Update Workflow Task Handler
 * Handles updating workflow task properties
 */
@injectable()
export class UpdateWorkflowTaskHandler extends CommandHandler<UpdateWorkflowTaskCommand, WorkflowTaskDto> {
  constructor(
    @inject('WorkflowTaskRepository') private taskRepository: IWorkflowTaskRepository
  ) {
    super();
  }

  async handle(command: UpdateWorkflowTaskCommand): Promise<Result<WorkflowTaskDto>> {
    const task = await this.taskRepository.findById(
      WorkflowTaskId.fromValue(command.props.taskId)
    );

    if (!task) {
      return Result.failure<WorkflowTaskDto>(new Error('Workflow task not found'));
    }

    // Update task form data
    if (command.props.formData !== undefined) {
      task.updateFormData(JSON.stringify(command.props.formData));
    }

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
