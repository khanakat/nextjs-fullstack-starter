import { DomainEvent } from '@/shared/domain/base';
import { DocumentId } from '../document-id.vo';
import { IndexName } from '../index-name.vo';

export interface DocumentDeletedEventProps {
  documentId: DocumentId;
  indexName: IndexName;
  occurredAt: Date;
}

export class DocumentDeletedEvent extends DomainEvent {
  readonly documentId: DocumentId;
  readonly indexName: IndexName;

  constructor(props: DocumentDeletedEventProps) {
    super();
    this.documentId = props.documentId;
    this.indexName = props.indexName;
  }

  getEventName(): string {
    return 'DocumentDeleted';
  }
}
