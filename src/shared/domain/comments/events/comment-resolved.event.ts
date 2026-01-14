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
    super(props.occurredAt);
    this.commentId = props.commentId;
    this.documentId = props.documentId;
  }
}
