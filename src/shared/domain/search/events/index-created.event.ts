import { DomainEvent } from '@/shared/domain/base';
import { IndexName } from '../index-name.vo';

export interface IndexCreatedEventProps {
  indexName: IndexName;
  occurredAt: Date;
}

export class IndexCreatedEvent extends DomainEvent {
  readonly indexName: IndexName;

  constructor(props: IndexCreatedEventProps) {
    super();
    this.indexName = props.indexName;
  }

  getEventName(): string {
    return 'IndexCreated';
  }
}
