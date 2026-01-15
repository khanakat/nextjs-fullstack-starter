import { DomainEvent } from '../../base/domain-event';

export interface CommentDeletedEventProps {
  commentId: string;
  documentId: string;
  softDelete: boolean;
  occurredAt: Date;
}

export class CommentDeletedEvent extends DomainEvent {
  readonly commentId: string;
  readonly documentId: string;
  readonly softDelete: boolean;

  constructor(props: CommentDeletedEventProps) {
    super();
    this.commentId = props.commentId;
    this.documentId = props.documentId;
    this.softDelete = props.softDelete;
  }

  getEventName(): string {
    return 'CommentDeleted';
  }
}
