import { QueryHandler } from '../../base/query-handler';
import { GetCommentQuery } from '../queries/get-comment.query';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class GetCommentHandler extends QueryHandler<GetCommentQuery, Comment | null> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(query: GetCommentQuery): Promise<Result<Comment | null>> {
    return this.commentRepository.findById(query.commentId);
  }
}
