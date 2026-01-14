import { Command } from '../../command.base';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface DeleteIndexCommandProps {
  indexName: string;
}

export class DeleteIndexCommand extends Command<DeleteIndexCommandProps> {
  readonly indexName: IndexName;

  constructor(props: DeleteIndexCommandProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
  }
}
