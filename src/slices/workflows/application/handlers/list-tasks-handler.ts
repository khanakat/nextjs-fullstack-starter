import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { ListWorkflowTasksQuery } from '../queries/list-tasks-query';
import type { IWorkflowTaskRepository } from '../../domain/repositories/workflow-task-repository';
import { WorkflowTaskDto } from '../dtos/workflow-task-dto';

/**
 * List Workflow Tasks Handler
 * Handles retrieving workflow tasks with filtering and pagination
 */
@injectable()
export class ListWorkflowTasksHandler extends QueryHandler<
  ListWorkflowTasksQuery,
  { tasks: WorkflowTaskDto[]; total: number }
> {
  constructor(
    @inject('WorkflowTaskRepository') private taskRepository: IWorkflowTaskRepository
  ) {
    super();
  }

  async handle(
    query: ListWorkflowTasksQuery
  ): Promise<Result<{ tasks: WorkflowTaskDto[]; total: number }>> {
    const result = await this.taskRepository.findAll({
      instanceId: query.props.instanceId,
      assigneeId: query.props.assigneeId,
      status: query.props.status,
      taskType: query.props.taskType,
      priority: query.props.priority,
      isOverdue: query.props.isOverdue,
      limit: query.props.limit,
      offset: query.props.offset,
      sortBy: query.props.sortBy,
      sortOrder: query.props.sortOrder,
    });

    const tasks = result.tasks.map((task) => this.toDto(task));

    return Result.success({
      tasks,
      total: result.total,
    });
  }

  private toDto(task: any): WorkflowTaskDto {
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
