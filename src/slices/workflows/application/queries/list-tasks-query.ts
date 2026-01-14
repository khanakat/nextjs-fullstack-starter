import { Query } from '../../../../shared/application/base/query';
import { WorkflowTaskStatus, TaskType, Priority } from '../../domain/entities/workflow-task';

/**
 * ListWorkflowTasksQuery
 * Query for retrieving workflow tasks with filtering and pagination
 */
export interface ListWorkflowTasksQueryProps {
  instanceId?: string;
  assigneeId?: string;
  status?: WorkflowTaskStatus;
  taskType?: TaskType;
  priority?: Priority;
  isOverdue?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ListWorkflowTasksQuery extends Query {
  public readonly props: ListWorkflowTasksQueryProps;

  constructor(props: ListWorkflowTasksQueryProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      limit: props.limit || 20,
      offset: props.offset || 0,
      sortBy: props.sortBy || 'createdAt',
      sortOrder: props.sortOrder || 'desc',
    };
  }
}
