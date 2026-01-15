import { DomainEvent } from '../../base/domain-event';

export interface CommentResolvedEventProps {
  commentId: string;
  documentId: string;
  occurredAt: Date;
}

export class CommentResolvedEvent extends DomainEvent {
  readonly commentId: string;
  readonly documentId: string;

  constructor(props: CommentResolvedEventProps) {
    super();
    this.commentId = props.commentId;
    this.documentId = props.documentId;
  }

  getEventName(): string {
    return 'CommentResolved';
  }
}
