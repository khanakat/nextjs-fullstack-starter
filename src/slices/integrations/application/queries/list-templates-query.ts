import { Query } from '../../../../shared/application/base/query';

/**
 * List Templates Query Props
 */
export interface ListTemplatesQueryProps {
  provider?: string;
  category?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}

/**
 * List Integration Templates Query
 */
export class ListTemplatesQuery extends Query {
  public readonly props: ListTemplatesQueryProps;

  constructor(props: ListTemplatesQueryProps) {
    super();
    this.props = {
      page: props.page || 1,
      limit: props.limit || 20,
      ...props,
    };
  }
}
