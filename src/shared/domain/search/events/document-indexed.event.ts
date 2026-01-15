import { DomainEvent } from '@/shared/domain/base';
import { DocumentId } from '../document-id.vo';
import { IndexName } from '../index-name.vo';

export interface DocumentIndexedEventProps {
  documentId: DocumentId;
  indexName: IndexName;
  occurredAt: Date;
}

export class DocumentIndexedEvent extends DomainEvent {
  readonly documentId: DocumentId;
  readonly indexName: IndexName;

  constructor(props: DocumentIndexedEventProps) {
    super();
    this.documentId = props.documentId;
    this.indexName = props.indexName;
  }

  getEventName(): string {
    return 'DocumentIndexed';
  }
}
