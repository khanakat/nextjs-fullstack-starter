import { Query } from '../../base/query';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface GetThreadQueryProps {
  commentId: string;
}

export class GetThreadQuery extends Query {
  readonly commentId: CommentId;

  constructor(props: GetThreadQueryProps, userId?: string) {
    super(userId);
    this.commentId = CommentId.create(props.commentId);
  }
}
