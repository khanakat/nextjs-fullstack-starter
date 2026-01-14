import { Command } from '../../command.base';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface CreateIndexCommandProps {
  indexName: string;
  mappings: Record<string, any>;
  settings?: {
    replicas?: number;
    shards?: number;
    refreshInterval?: string;
  };
}

export class CreateIndexCommand extends Command<CreateIndexCommandProps> {
  readonly indexName: IndexName;
  readonly mappings: Record<string, any>;
  readonly settings?: {
    replicas?: number;
    shards?: number;
    refreshInterval?: string;
  };

  constructor(props: CreateIndexCommandProps) {
    super(props);
    this.indexName = IndexName.create(props.indexName);
    this.mappings = props.mappings;
    this.settings = props.settings;
  }
}
