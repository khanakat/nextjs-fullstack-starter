import { Query } from '../../../../shared/application/base/query';

/**
 * Get Organizations Query
 * Used to retrieve multiple organizations with optional filters
 */
export interface GetOrganizationsQueryProps {
  ownerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class GetOrganizationsQuery extends Query {
  public readonly props: GetOrganizationsQueryProps;

  constructor(props: GetOrganizationsQueryProps = {}) {
    super();
    this.props = props;
  }
}
