import { QueryHandler } from '../../query-handler.base';
import { GetDocumentQuery } from '../queries/get-document.query';
import { ISearchService } from '../../../domain/search/isearch.service';
import { SearchDocument } from '../../../domain/search/search-document.entity';
import { Result } from '../../base/result';

export class GetDocumentHandler implements QueryHandler<GetDocumentQuery, SearchDocument | null> {
  constructor(private searchService: ISearchService) {}

  async handle(query: GetDocumentQuery): Promise<Result<SearchDocument | null>> {
    return this.searchService.getDocument(query.documentId, query.indexName);
  }
}
