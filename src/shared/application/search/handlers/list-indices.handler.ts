import { QueryHandler } from '../../query-handler.base';
import { ListIndicesQuery } from '../queries/list-indices.query';
import { ISearchIndexRepository } from '../../../domain/search/isearch-index.repository';
import { SearchIndex } from '../../../domain/search/search-index.entity';
import { Result } from '../../base/result';

export class ListIndicesHandler implements QueryHandler<ListIndicesQuery, SearchIndex[]> {
  constructor(private indexRepository: ISearchIndexRepository) {}

  async handle(query: ListIndicesQuery): Promise<Result<SearchIndex[]>> {
    return this.indexRepository.findAll();
  }
}
