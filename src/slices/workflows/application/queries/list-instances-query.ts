import { Query } from '../../../../shared/application/base/query';
import { WorkflowInstanceStatus, Priority } from '../../domain/entities/workflow-instance';

/**
 * ListWorkflowInstancesQuery
 * Query for retrieving workflow instances with filtering and pagination
 */
export interface ListWorkflowInstancesQueryProps {
  workflowId?: string;
  status?: WorkflowInstanceStatus;
  organizationId?: string;
  triggeredBy?: string;
  priority?: Priority;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ListWorkflowInstancesQuery extends Query {
  public readonly props: ListWorkflowInstancesQueryProps;

  constructor(props: ListWorkflowInstancesQueryProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      limit: props.limit || 20,
      offset: props.offset || 0,
      sortBy: props.sortBy || 'startedAt',
      sortOrder: props.sortOrder || 'desc',
    };
  }
}
