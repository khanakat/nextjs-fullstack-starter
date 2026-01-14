import { QueryHandler } from '../../query-handler.base';
import { ListCommentsQuery } from '../queries/list-comments.query';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Result } from '../../base/result';

export class ListCommentsHandler implements QueryHandler<ListCommentsQuery, Result<any>> {
  constructor(private commentRepository: ICommentRepository) {}

  async handle(query: ListCommentsQuery): Promise<Result<any>> {
    let searchResult;

    if (query.threadId) {
      // Get specific thread
      const threadResult = await this.commentRepository.getThread(query.threadId);
      if (threadResult.isFailure || !threadResult.value) {
        return Result.failure<any>(threadResult.error || 'Thread not found');
      }

      // Convert to DTO format
      const thread = threadResult.value;
      return Result.success<any>({
        comments: [thread.toJSON()],
        pagination: {
          total: 1,
          limit: query.limit,
          offset: query.offset,
          hasMore: false,
        },
      });
    }

    // Search by criteria
    searchResult = await this.commentRepository.search(
      {
        documentId: query.documentId,
        resolved: query.resolved,
      },
      {
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
      }
    );

    if (searchResult.isFailure) {
      return Result.failure<any>(searchResult.error);
    }

    // Convert to DTO format
    const comments = searchResult.value.comments.map((c) => c.toJSON());

    return Result.success<any>({
      comments,
      pagination: {
        total: searchResult.value.total,
        limit: query.limit,
        offset: query.offset,
        hasMore: searchResult.value.hasMore,
      },
    });
  }
}
