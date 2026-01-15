import { QueryHandler } from '../../base/query-handler';
import { GetThreadQuery } from '../queries/get-thread.query';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class GetThreadHandler extends QueryHandler<GetThreadQuery, Comment | null> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(query: GetThreadQuery): Promise<Result<Comment | null>> {
    return this.commentRepository.getThread(query.commentId);
  }
}
