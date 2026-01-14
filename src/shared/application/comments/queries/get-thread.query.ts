import { Query } from '../../base/query';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';

export interface GetThreadQueryProps {
  commentId: string;
}

export class GetThreadQuery extends Query<GetThreadQueryProps> {
  readonly commentId: CommentId;

  constructor(props: GetThreadQueryProps) {
    super(props);
    this.commentId = CommentId.create(props.commentId);
  }
}
