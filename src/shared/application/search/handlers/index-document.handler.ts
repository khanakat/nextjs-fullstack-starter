import { CommandHandler } from '../../command-handler.base';
import { IndexDocumentCommand } from '../commands/index-document.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { SearchDocument } from '../../../domain/search/search-document.entity';
import { Result } from '../../base/result';

export class IndexDocumentHandler implements CommandHandler<IndexDocumentCommand> {
  constructor(private searchService: ISearchService) {}

  async handle(command: IndexDocumentCommand): Promise<Result<SearchDocument>> {
    const document = SearchDocument.create({
      id: command.documentId,
      indexName: command.indexName,
      data: command.data,
      updatedAt: new Date(),
    });

    if (document.isFailure) {
      return Result.failure<SearchDocument>(document.error);
    }

    return this.searchService.indexDocument(document.value);
  }
}
