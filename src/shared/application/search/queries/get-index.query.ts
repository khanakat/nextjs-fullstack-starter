import { Query } from '../../base/query';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface GetIndexQueryProps {
  indexName: string;
}

export class GetIndexQuery extends Query {
  readonly indexName: IndexName;

  constructor(props: GetIndexQueryProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
  }
}
