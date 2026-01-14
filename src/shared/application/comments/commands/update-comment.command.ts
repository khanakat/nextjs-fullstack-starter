import { Command } from '../../base/command';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface UpdateCommentCommandProps {
  commentId: string;
  content?: string;
  resolved?: boolean;
  metadata?: Record<string, any>;
}

export class UpdateCommentCommand extends Command<UpdateCommentCommandProps> {
  readonly commentId: CommentId;
  readonly content?: string;
  readonly resolved?: boolean;
  readonly metadata?: Record<string, any>;

  constructor(props: UpdateCommentCommandProps) {
    super(props);
    this.commentId = CommentId.create(props.commentId);
    this.content = props.content;
    this.resolved = props.resolved;
    this.metadata = props.metadata;
  }
}
