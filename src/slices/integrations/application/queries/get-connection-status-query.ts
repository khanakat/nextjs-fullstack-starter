import { Query } from '@/shared/domain/query';

/**
 * Query to get connection status for an integration
 */
export class GetConnectionStatusQuery extends Query {
  public readonly props: GetConnectionStatusQueryProps;

  constructor(props: GetConnectionStatusQueryProps) {
    super();
    this.props = props;
  }
}

export interface GetConnectionStatusQueryProps {
  integrationId: string;
  organizationId: string;
}
