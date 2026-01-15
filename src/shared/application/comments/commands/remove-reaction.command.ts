import { Command } from '../../base/command';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface RemoveReactionCommandProps {
  commentId: string;
  emoji: string;
  userId: string;
}

export class RemoveReactionCommand extends Command {
  readonly commentId: CommentId;
  readonly emoji: string;
  readonly userId: string;

  constructor(props: RemoveReactionCommandProps, userId?: string) {
    super(userId);
    this.commentId = CommentId.create(props.commentId);
    this.emoji = props.emoji;
    this.userId = props.userId;
  }
}
