import { Query } from '../../base/query';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface GetCommentQueryProps {
  commentId: string;
}

export class GetCommentQuery extends Query {
  readonly commentId: CommentId;

  constructor(props: GetCommentQueryProps, userId?: string) {
    super(userId);
    this.commentId = CommentId.create(props.commentId);
  }
}
