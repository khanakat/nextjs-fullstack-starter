import { DomainEvent } from '../../base/domain-event';

export interface CommentCreatedEventProps {
  commentId: string;
  documentId: string;
  authorId: string;
  parentId?: string;
  occurredAt: Date;
}

export class CommentCreatedEvent extends DomainEvent {
  readonly commentId: string;
  readonly documentId: string;
  readonly authorId: string;
  readonly parentId?: string;

  constructor(props: CommentCreatedEventProps) {
    super();
    this.commentId = props.commentId;
    this.documentId = props.documentId;
    this.authorId = props.authorId;
    this.parentId = props.parentId;
  }

  getEventName(): string {
    return 'CommentCreated';
  }
}
