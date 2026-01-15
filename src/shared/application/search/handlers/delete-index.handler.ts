import { CommandHandler } from '../../base/command-handler';
import { DeleteIndexCommand } from '../commands/delete-index.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class DeleteIndexHandler extends CommandHandler<DeleteIndexCommand, void> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(command: DeleteIndexCommand): Promise<Result<void>> {
    return this.searchService.deleteIndex(command.indexName);
  }
}
