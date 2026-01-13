import { Query } from '../../../../shared/application/base/query';

/**
 * GetWorkflowQuery
 * Query for retrieving a single workflow by ID
 */
export interface GetWorkflowQueryProps {
  workflowId: string;
}

export class GetWorkflowQuery extends Query {
  public readonly props: GetWorkflowQueryProps;

  constructor(props: GetWorkflowQueryProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
