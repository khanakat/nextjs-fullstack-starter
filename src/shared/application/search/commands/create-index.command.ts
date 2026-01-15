import { Command } from '../../base/command';
import { IndexName } from '../../../domain/search/index-name.vo';

export interface CreateIndexCommandProps {
  indexName: string;
  mappings: Record<string, unknown>;
  settings?: {
    replicas?: number;
    shards?: number;
    refreshInterval?: string;
  };
}

export class CreateIndexCommand extends Command {
  readonly indexName: IndexName;
  readonly mappings: Record<string, unknown>;
  readonly settings?: {
    replicas?: number;
    shards?: number;
    refreshInterval?: string;
  };

  constructor(props: CreateIndexCommandProps, userId?: string) {
    super(userId);
    this.indexName = IndexName.create(props.indexName);
    this.mappings = props.mappings;
    this.settings = props.settings;
  }
}
