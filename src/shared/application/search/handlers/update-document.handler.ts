import { CommandHandler } from '../../command-handler.base';
import { UpdateDocumentCommand } from '../commands/update-document.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { SearchDocument } from '../../../domain/search/search-document.entity';
import { Result } from '../../base/result';

export class UpdateDocumentHandler implements CommandHandler<UpdateDocumentCommand> {
  constructor(private searchService: ISearchService) {}

  async handle(command: UpdateDocumentCommand): Promise<Result<SearchDocument>> {
    const document = SearchDocument.create({
      id: command.documentId,
      indexName: command.indexName,
      data: command.data,
      updatedAt: new Date(),
    });

    if (document.isFailure) {
      return Result.failure<SearchDocument>(document.error);
    }

    return this.searchService.updateDocument(document.value);
  }
}
