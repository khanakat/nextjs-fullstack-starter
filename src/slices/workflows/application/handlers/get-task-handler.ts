import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowTask } from '../../domain/entities/workflow-task';
import { GetWorkflowTaskQuery } from '../queries/get-task-query';
import type { IWorkflowTaskRepository } from '../../domain/repositories/workflow-task-repository';
import { WorkflowTaskDto } from '../dtos/workflow-task-dto';
import { WorkflowTaskId } from '../../domain/value-objects/workflow-task-id';

/**
 * Get Workflow Task Handler
 * Handles retrieving a single workflow task by ID
 */
@injectable()
export class GetWorkflowTaskHandler extends QueryHandler<GetWorkflowTaskQuery, WorkflowTaskDto> {
  constructor(
    @inject('WorkflowTaskRepository') private taskRepository: IWorkflowTaskRepository
  ) {
    super();
  }

  async handle(query: GetWorkflowTaskQuery): Promise<Result<WorkflowTaskDto>> {
    const task = await this.taskRepository.findById(
      WorkflowTaskId.fromValue(query.props.taskId)
    );

    if (!task) {
      return Result.failure<WorkflowTaskDto>(new Error('Workflow task not found'));
    }

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
