import { QueryHandler } from '../../base/query-handler';
import { PerformSearchQuery } from '../queries/search.query';
import { ISearchService } from '../../../domain/search/isearch.service';
import { SearchResult } from '../../../domain/search/search-result.vo';
import { Result } from '../../base/result';

export class SearchHandler extends QueryHandler<PerformSearchQuery, SearchResult> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(query: PerformSearchQuery): Promise<Result<SearchResult>> {
    return this.searchService.search(query.searchQuery, query.indexName);
  }
}
