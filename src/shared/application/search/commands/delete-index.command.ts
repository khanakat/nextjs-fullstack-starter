import { Command } from '../../base/command';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface DeleteIndexCommandProps {
  indexName: string;
}

export class DeleteIndexCommand extends Command {
  readonly indexName: IndexName;

  constructor(props: DeleteIndexCommandProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
  }
}
