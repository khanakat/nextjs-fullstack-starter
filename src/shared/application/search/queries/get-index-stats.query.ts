import { Query } from '../../query.base';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface GetIndexStatsQueryProps {
  indexName: string;
}

export class GetIndexStatsQuery extends Query<GetIndexStatsQueryProps> {
  readonly indexName: IndexName;

  constructor(props: GetIndexStatsQueryProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
  }
}
