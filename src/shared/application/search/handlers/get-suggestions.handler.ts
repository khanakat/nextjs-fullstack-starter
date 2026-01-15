import { QueryHandler } from '../../base/query-handler';
import { GetSuggestionsQuery } from '../queries/get-suggestions.query';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class GetSuggestionsHandler extends QueryHandler<GetSuggestionsQuery, string[]> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(query: GetSuggestionsQuery): Promise<Result<string[]>> {
    return this.searchService.getSuggestions(query.prefix, query.indexName, query.limit);
  }
}
