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
    super();
    this.commentId = props.commentId;
    this.emoji = props.emoji;
    this.userId = props.userId;
  }

  getEventName(): string {
    return 'CommentReactionRemoved';
  }
}
