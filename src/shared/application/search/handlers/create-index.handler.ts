import { CommandHandler } from '../../base/command-handler';
import { CreateIndexCommand } from '../commands/create-index.command';
import { ISearchService } from '../../../domain/search/isearch.service';
import { Result } from '../../base/result';

export class CreateIndexHandler extends CommandHandler<CreateIndexCommand, void> {
  constructor(private searchService: ISearchService) {
    super();
  }

  async handle(command: CreateIndexCommand): Promise<Result<void>> {
    const mappings = {
      properties: command.mappings,
      settings: command.settings,
    };

    return this.searchService.createIndex(command.indexName, mappings);
  }
}
