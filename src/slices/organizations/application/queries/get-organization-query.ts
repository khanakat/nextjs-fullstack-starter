import { Query } from '../../../../shared/application/base/query';

/**
 * Get Organization Query
 * Used to retrieve a single organization by ID
 */
export interface GetOrganizationQueryProps {
  id: string;
}

export class GetOrganizationQuery extends Query {
  public readonly props: GetOrganizationQueryProps;

  constructor(props: GetOrganizationQueryProps) {
    super();
    this.props = props;
  }
}
