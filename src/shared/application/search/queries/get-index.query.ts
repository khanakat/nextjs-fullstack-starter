import { Query } from '../../query.base';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface GetIndexQueryProps {
  indexName: string;
}

export class GetIndexQuery extends Query<GetIndexQueryProps> {
  readonly indexName: IndexName;

  constructor(props: GetIndexQueryProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
  }
}
