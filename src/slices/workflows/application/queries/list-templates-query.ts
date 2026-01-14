import { Query } from '../../../../shared/application/base/query';

/**
 * ListWorkflowTemplatesQuery
 * Query for retrieving workflow templates with filtering and pagination
 */
export interface ListWorkflowTemplatesQueryProps {
  workflowId?: string;
  organizationId?: string;
  category?: string;
  isBuiltIn?: boolean;
  isPublic?: boolean;
  search?: string;
  tags?: string[];
  createdBy?: string;
  minUsageCount?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ListWorkflowTemplatesQuery extends Query {
  public readonly props: ListWorkflowTemplatesQueryProps;

  constructor(props: ListWorkflowTemplatesQueryProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      limit: props.limit || 20,
      offset: props.offset || 0,
      sortBy: props.sortBy || 'usageCount',
      sortOrder: props.sortOrder || 'desc',
    };
  }
}
