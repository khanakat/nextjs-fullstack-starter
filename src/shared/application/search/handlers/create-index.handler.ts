import { CommandHandler } from '../../command-handler.base';
import { CreateIndexCommand } from '../commands/create-index.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class CreateIndexHandler implements CommandHandler<CreateIndexCommand> {
  constructor(private searchService: ISearchService) {}

  async handle(command: CreateIndexCommand): Promise<Result<void>> {
    const mappings = {
      properties: command.mappings,
      settings: command.settings,
    };

    return this.searchService.createIndex(command.indexName, mappings);
  }
}
