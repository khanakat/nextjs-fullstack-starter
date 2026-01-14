import { QueryHandler } from '../../query-handler.base';
import { GetIndexStatsQuery } from '../queries/get-index-stats.query';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class GetIndexStatsHandler implements QueryHandler<GetIndexStatsQuery, Record<string, any>> {
  constructor(private searchService: ISearchService) {}

  async handle(query: GetIndexStatsQuery): Promise<Result<Record<string, any>>> {
    return this.searchService.getIndexStats(query.indexName);
  }
}
