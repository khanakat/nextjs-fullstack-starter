import { Query } from '../../../../shared/application/base/query';

/**
 * GetWorkflowInstanceQuery
 * Query for retrieving a single workflow instance by ID
 */
export interface GetWorkflowInstanceQueryProps {
  instanceId: string;
}

export class GetWorkflowInstanceQuery extends Query {
  public readonly props: GetWorkflowInstanceQueryProps;

  constructor(props: GetWorkflowInstanceQueryProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
