import { QueryHandler } from '../../query-handler.base';
import { SearchQuery as SearchQry } from '../queries/search.query';
import { ISearchService } from '../../../domain/search/isearch.service';
import { SearchResult } from '../../../domain/search/search-result.vo';
import { Result } from '../../base/result';

export class SearchHandler implements QueryHandler<SearchQry, SearchResult> {
  constructor(private searchService: ISearchService) {}

  async handle(query: SearchQry): Promise<Result<SearchResult>> {
    return this.searchService.search(query.searchQuery, query.indexName);
  }
}
