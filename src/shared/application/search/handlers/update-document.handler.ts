import { CommandHandler } from '../../base/command-handler';
import { UpdateDocumentCommand } from '../commands/update-document.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { SearchDocument } from '../../../domain/search/search-document.entity';
import { Result } from '../../base/result';

export class UpdateDocumentHandler extends CommandHandler<UpdateDocumentCommand, SearchDocument> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(command: UpdateDocumentCommand): Promise<Result<SearchDocument>> {
    const documentResult = SearchDocument.create({
      id: command.documentId,
      indexName: command.indexName,
      data: command.data,
      updatedAt: new Date(),
    });

    if (documentResult.isFailure) {
      return Result.failure<SearchDocument>(documentResult.error);
    }

    return this.searchService.updateDocument(documentResult.value);
  }
}
