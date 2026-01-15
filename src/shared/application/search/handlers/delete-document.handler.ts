import { CommandHandler } from '../../base/command-handler';
import { DeleteDocumentCommand } from '../commands/delete-document.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class DeleteDocumentHandler extends CommandHandler<DeleteDocumentCommand, void> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(command: DeleteDocumentCommand): Promise<Result<void>> {
    return this.searchService.deleteDocument(command.documentId, command.indexName);
  }
}
