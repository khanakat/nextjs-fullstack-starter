import { Command } from '../../base/command';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface DeleteCommentCommandProps {
  commentId: string;
}

export class DeleteCommentCommand extends Command {
  readonly commentId: CommentId;

  constructor(props: DeleteCommentCommandProps, userId?: string) {
    super(userId);
    this.commentId = CommentId.create(props.commentId);
  }
}
