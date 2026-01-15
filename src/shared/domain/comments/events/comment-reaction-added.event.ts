import { DomainEvent } from '../../base/domain-event';

export interface CommentReactionAddedEventProps {
  commentId: string;
  emoji: string;
  userId: string;
  occurredAt: Date;
}

export class CommentReactionAddedEvent extends DomainEvent {
  readonly commentId: string;
  readonly emoji: string;
  readonly userId: string;

  constructor(props: CommentReactionAddedEventProps) {
    super();
    this.commentId = props.commentId;
    this.emoji = props.emoji;
    this.userId = props.userId;
  }

  getEventName(): string {
    return 'CommentReactionAdded';
  }
}
