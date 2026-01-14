import { CommandHandler } from '../../command-handler.base';
import { DeleteIndexCommand } from '../commands/delete-index.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class DeleteIndexHandler implements CommandHandler<DeleteIndexCommand> {
  constructor(private searchService: ISearchService) {}

  async handle(command: DeleteIndexCommand): Promise<Result<void>> {
    return this.searchService.deleteIndex(command.indexName);
  }
}
