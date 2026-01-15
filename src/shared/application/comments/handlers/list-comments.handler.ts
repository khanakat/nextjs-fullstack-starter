import { QueryHandler } from '../../base/query-handler';
import { ListCommentsQuery } from '../queries/list-comments.query';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Result } from '../../base/result';

export class ListCommentsHandler extends QueryHandler<ListCommentsQuery, unknown> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(query: ListCommentsQuery): Promise<Result<unknown>> {
    let searchResult;

    if (query.threadId) {
      // Get specific thread
      const threadResult = await this.commentRepository.getThread(query.threadId);
      if (threadResult.isFailure || !threadResult.value) {
        return Result.failure<unknown>(new Error('Thread not found'));
      }

      // Convert to DTO format
      return Result.success<unknown>({
        comments: [threadResult.value.toJSON()],
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
      return Result.failure<unknown>(searchResult.error);
    }

    // Convert to DTO format
    const comments = searchResult.value.comments.map((c: any) => c.toJSON());

    return Result.success<unknown>({
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
