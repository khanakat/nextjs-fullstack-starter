import { Command } from '../../base/command';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface AddReactionCommandProps {
  commentId: string;
  emoji: string;
  userId: string;
}

export class AddReactionCommand extends Command {
  readonly commentId: CommentId;
  readonly emoji: string;
  readonly userId: string;

  constructor(props: AddReactionCommandProps, userId?: string) {
    super(userId);
    this.commentId = CommentId.create(props.commentId);
    this.emoji = props.emoji;
    this.userId = props.userId;
  }
}
