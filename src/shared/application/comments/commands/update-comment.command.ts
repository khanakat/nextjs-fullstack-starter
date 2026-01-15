import { Command } from '../../base/command';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface UpdateCommentCommandProps {
  commentId: string;
  content?: string;
  resolved?: boolean;
  metadata?: Record<string, unknown>;
}

export class UpdateCommentCommand extends Command {
  readonly commentId: CommentId;
  readonly content?: string;
  readonly resolved?: boolean;
  readonly metadata?: Record<string, unknown>;

  constructor(props: UpdateCommentCommandProps, userId?: string) {
    super(userId);
    this.commentId = CommentId.create(props.commentId);
    this.content = props.content;
    this.resolved = props.resolved;
    this.metadata = props.metadata;
  }
}
