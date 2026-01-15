import { DomainEvent } from '../../base/domain-event';

export interface CommentUpdatedEventProps {
  commentId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  occurredAt: Date;
}

export class CommentUpdatedEvent extends DomainEvent {
  readonly commentId: string;
  readonly field: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;

  constructor(props: CommentUpdatedEventProps) {
    super();
    this.commentId = props.commentId;
    this.field = props.field;
    this.oldValue = props.oldValue;
    this.newValue = props.newValue;
  }

  getEventName(): string {
    return 'CommentUpdated';
  }
}
