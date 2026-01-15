import { Query } from '../../base/query';
import { IndexName } from '../../../domain/search/index-name.vo';
import { SearchQuery as SearchQueryVO } from '../../../domain/search/search-query.vo';

export interface PerformSearchQueryProps {
  indexName: string;
  query: string;
  filters?: Record<string, unknown>;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  page?: number;
  limit?: number;
}

export class PerformSearchQuery extends Query {
  readonly indexName: IndexName;
  readonly searchQuery: SearchQueryVO;

  constructor(props: PerformSearchQueryProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
    this.searchQuery = SearchQueryVO.create({
      query: props.query,
      filters: props.filters,
      sort: props.sort,
      page: props.page,
      limit: props.limit,
    });
  }
}
