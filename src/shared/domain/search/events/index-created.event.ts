import { DomainEvent } from '../../domain-event.base';
import { IndexName } from '../index-name.vo';

export interface IndexCreatedEventProps {
  indexName: IndexName;
  occurredAt: Date;
}

export class IndexCreatedEvent extends DomainEvent {
  readonly indexName: IndexName;

  constructor(props: IndexCreatedEventProps) {
    super(props.occurredAt);
    this.indexName = props.indexName;
  }
}
