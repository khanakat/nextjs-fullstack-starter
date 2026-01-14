import { DomainEvent } from '../../base/domain-event';

export interface CommentUpdatedEventProps {
  commentId: string;
  field: string;
  oldValue: any;
  newValue: any;
  occurredAt: Date;
}

export class CommentUpdatedEvent extends DomainEvent {
  readonly commentId: string;
  readonly field: string;
  readonly oldValue: any;
  readonly newValue: any;

  constructor(props: CommentUpdatedEventProps) {
    super(props.occurredAt);
    this.commentId = props.commentId;
    this.field = props.field;
    this.oldValue = props.oldValue;
    this.newValue = props.newValue;
  }
}
