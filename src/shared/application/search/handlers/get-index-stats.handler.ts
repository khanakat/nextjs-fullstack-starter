import { QueryHandler } from '../../base/query-handler';
import { GetIndexStatsQuery } from '../queries/get-index-stats.query';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class GetIndexStatsHandler extends QueryHandler<GetIndexStatsQuery, Record<string, any>> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(query: GetIndexStatsQuery): Promise<Result<Record<string, any>>> {
    return this.searchService.getIndexStats(query.indexName);
  }
}
