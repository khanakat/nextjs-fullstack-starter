import { Query } from '../../../../shared/application/base/query';
import { WorkflowStatus } from '../../domain/entities/workflow';

/**
 * GetWorkflowsQuery
 * Query for retrieving workflows with optional filters
 */
export interface GetWorkflowsQueryProps {
  organizationId?: string;
  status?: WorkflowStatus;
  isTemplate?: boolean;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

export class GetWorkflowsQuery extends Query {
  public readonly props: GetWorkflowsQueryProps;

  constructor(props: GetWorkflowsQueryProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
