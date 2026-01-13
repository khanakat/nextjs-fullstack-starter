import { Query } from '../../../../shared/application/base/query';

/**
 * List Files Query
 * Query for retrieving files with filtering and pagination
 */
export class ListFilesQuery extends Query {
  public readonly props: {
    userId: string;
    limit?: number;
    offset?: number;
    mimeType?: string;
    minSize?: number;
    maxSize?: number;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  };

  constructor(props: ListFilesQuery['props']) {
    super();
    this.props = props;
  }
}
