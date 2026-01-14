import { QueryHandler } from '../../query-handler.base';
import { GetCommentQuery } from '../queries/get-comment.query';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class GetCommentHandler implements QueryHandler<GetCommentQuery, Comment | null> {
  constructor(private commentRepository: ICommentRepository) {}

  async handle(query: GetCommentQuery): Promise<Result<Comment | null>> {
    return this.commentRepository.findById(query.commentId);
  }
}
