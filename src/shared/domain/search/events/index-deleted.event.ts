import { DomainEvent } from '../../domain-event.base';
import { IndexName } from '../index-name.vo';

export interface IndexDeletedEventProps {
  indexName: IndexName;
  occurredAt: Date;
}

export class IndexDeletedEvent extends DomainEvent {
  readonly indexName: IndexName;

  constructor(props: IndexDeletedEventProps) {
    super(props.occurredAt);
    this.indexName = props.indexName;
  }
}
