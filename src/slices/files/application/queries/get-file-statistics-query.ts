import { Query } from '../../../../shared/application/base/query';

/**
 * Get File Statistics Query
 * Query for retrieving file statistics for a user
 */
export class GetFileStatisticsQuery extends Query {
  public readonly props: {
    userId: string;
  };

  constructor(props: GetFileStatisticsQuery['props']) {
    super();
    this.props = props;
  }
}
