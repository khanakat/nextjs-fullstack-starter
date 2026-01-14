import { Query } from '../../query.base';
import { IndexName } from '../../../domain/search/index-name.vo';
import { SearchQuery } from '../../../domain/search/search-query.vo';

export interface SearchQueryProps {
  indexName: string;
  query: string;
  filters?: Record<string, any>;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  page?: number;
  limit?: number;
}

export class SearchQuery extends Query<SearchQueryProps> {
  readonly indexName: IndexName;
  readonly searchQuery: SearchQuery;

  constructor(props: SearchQueryProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
    this.searchQuery = SearchQuery.create({
      query: props.query,
      filters: props.filters,
      sort: props.sort,
      page: props.page,
      limit: props.limit,
    });
  }
}
