import { QueryHandler } from '../../query-handler.base';
import { GetIndexQuery } from '../queries/get-index.query';
import { ISearchIndexRepository } from '../../../domain/search/isearch-index.repository';
import { SearchIndex } from '../../../domain/search/search-index.entity';
import { Result } from '../../base/result';

export class GetIndexHandler implements QueryHandler<GetIndexQuery, SearchIndex | null> {
  constructor(private indexRepository: ISearchIndexRepository) {}

  async handle(query: GetIndexQuery): Promise<Result<SearchIndex | null>> {
    return this.indexRepository.findByName(query.indexName);
  }
}
