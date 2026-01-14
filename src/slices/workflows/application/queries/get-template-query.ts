import { Query } from '../../../../shared/application/base/query';

/**
 * GetWorkflowTemplateQuery
 * Query for retrieving a single workflow template by ID
 */
export interface GetWorkflowTemplateQueryProps {
  templateId: string;
}

export class GetWorkflowTemplateQuery extends Query {
  public readonly props: GetWorkflowTemplateQueryProps;

  constructor(props: GetWorkflowTemplateQueryProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
