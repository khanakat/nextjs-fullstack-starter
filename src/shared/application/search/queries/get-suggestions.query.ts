import { Query } from '../../query.base';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface GetSuggestionsQueryProps {
  prefix: string;
  indexName?: string;
  limit?: number;
}

export class GetSuggestionsQuery extends Query<GetSuggestionsQueryProps> {
  readonly prefix: string;
  readonly indexName?: IndexName;
  readonly limit: number;

  constructor(props: GetSuggestionsQueryProps) {
    super(props);
    this.prefix = props.prefix;

    if (!props.prefix || props.prefix.trim().length === 0) {
      throw new Error('Prefix cannot be empty');
    }

    this.indexName = props.indexName ? IndexName.create(props.indexName) : undefined;
    this.limit = props.limit || 10;
  }
}
