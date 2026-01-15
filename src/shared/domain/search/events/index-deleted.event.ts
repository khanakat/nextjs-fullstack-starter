import { DomainEvent } from '@/shared/domain/base';
import { IndexName } from '../index-name.vo';

export interface IndexDeletedEventProps {
  indexName: IndexName;
  occurredAt: Date;
}

export class IndexDeletedEvent extends DomainEvent {
  readonly indexName: IndexName;

  constructor(props: IndexDeletedEventProps) {
    super();
    this.indexName = props.indexName;
  }

  getEventName(): string {
    return 'IndexDeleted';
  }
}
