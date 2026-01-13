import { Query } from '../../../../shared/application/base/query';

/**
 * Get File Query
 * Query for retrieving a single file by ID
 */
export class GetFileQuery extends Query {
  public readonly props: {
    fileId: string;
    userId: string;
  };

  constructor(props: GetFileQuery['props']) {
    super();
    this.props = props;
  }
}
