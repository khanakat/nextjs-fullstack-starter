import { DomainEvent } from '../../base/domain-event';

export interface CommentReactionRemovedEventProps {
  commentId: string;
  emoji: string;
  userId: string;
  occurredAt: Date;
}

export class CommentReactionRemovedEvent extends DomainEvent {
  readonly commentId: string;
  readonly emoji: string;
  readonly userId: string;

  constructor(props: CommentReactionRemovedEventProps) {
    super(props.occurredAt);
    this.commentId = props.commentId;
    this.emoji = props.emoji;
    this.userId = props.userId;
  }
}
