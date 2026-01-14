import { Query } from '../../../../shared/application/base/query';

/**
 * GetWorkflowTaskQuery
 * Query for retrieving a single workflow task by ID
 */
export interface GetWorkflowTaskQueryProps {
  taskId: string;
}

export class GetWorkflowTaskQuery extends Query {
  public readonly props: GetWorkflowTaskQueryProps;

  constructor(props: GetWorkflowTaskQueryProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
