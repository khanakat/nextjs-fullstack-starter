import { Query } from '@/shared/domain/query';

/**
 * Query to get test history for an integration
 */
export class GetTestHistoryQuery extends Query {
  public readonly props: GetTestHistoryQueryProps;

  constructor(props: GetTestHistoryQueryProps) {
    super();
    this.props = props;
  }
}

export interface GetTestHistoryQueryProps {
  integrationId: string;
  connectionId?: string;
  limit?: number;
}
