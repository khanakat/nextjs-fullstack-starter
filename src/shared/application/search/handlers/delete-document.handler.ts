import { CommandHandler } from '../../command-handler.base';
import { DeleteDocumentCommand } from '../commands/delete-document.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class DeleteDocumentHandler implements CommandHandler<DeleteDocumentCommand> {
  constructor(private searchService: ISearchService) {}

  async handle(command: DeleteDocumentCommand): Promise<Result<void>> {
    return this.searchService.deleteDocument(command.documentId, command.indexName);
  }
}
