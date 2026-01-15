import { Query } from '../../base/query';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface GetIndexStatsQueryProps {
  indexName: string;
}

export class GetIndexStatsQuery extends Query {
  readonly indexName: IndexName;

  constructor(props: GetIndexStatsQueryProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
  }
}
