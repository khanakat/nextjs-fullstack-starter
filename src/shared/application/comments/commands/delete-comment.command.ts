import { Command } from '../../base/command';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface DeleteCommentCommandProps {
  commentId: string;
}

export class DeleteCommentCommand extends Command<DeleteCommentCommandProps> {
  readonly commentId: CommentId;

  constructor(props: DeleteCommentCommandProps) {
    super(props);
    this.commentId = CommentId.create(props.commentId);
  }
}
