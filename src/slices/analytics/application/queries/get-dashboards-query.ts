import { Query } from '../../../../shared/application/base/query';

/**
 * Get Dashboards Query
 * Query for retrieving multiple dashboards with optional filters
 */
export interface GetDashboardsQueryProps {
  organizationId?: string;
  createdBy?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isPublic?: boolean;
  isTemplate?: boolean;
  page?: number;
  limit?: number;
}

export class GetDashboardsQuery extends Query {
  public readonly props: GetDashboardsQueryProps;

  constructor(props: GetDashboardsQueryProps = {}, userId?: string) {
    super(userId);
    this.props = props;
  }
}
