import { Result } from '../../../application/base/result';
import { Comment } from '../entities/comment.entity';
import { CommentId } from '../value-objects/comment-id.vo';
import { UniqueId } from '../../value-objects/unique-id';

export interface CommentSearchCriteria {
  documentId?: UniqueId;
  authorId?: string;
  parentId?: CommentId;
  resolved?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CommentSearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CommentSearchResult {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}

/**
 * Repository interface for Comment aggregate
 * Defines data access operations for comments
 */
export interface ICommentRepository {
  /**
   * Save a comment (create or update)
   */
  save(comment: Comment): Promise<Result<void>>;

  /**
   * Find a comment by its unique identifier
   */
  findById(id: CommentId): Promise<Result<Comment | null>>;

  /**
   * Find comments by document ID
   */
  findByDocumentId(
    documentId: UniqueId,
    options?: CommentSearchOptions
  ): Promise<Result<CommentSearchResult>>;

  /**
   * Find comments by multiple IDs
   */
  findByIds(ids: CommentId[]): Promise<Result<Comment[]>>;

  /**
   * Find comments by author
   */
  findByAuthor(authorId: string, options?: CommentSearchOptions): Promise<Result<CommentSearchResult>>;

  /**
   * Find comments by parent ID (replies)
   */
  findByParentId(parentId: CommentId, options?: CommentSearchOptions): Promise<Result<Comment[]>>;

  /**
   * Find top-level comments (no parent)
   */
  findTopLevelByDocument(
    documentId: UniqueId,
    options?: CommentSearchOptions
  ): Promise<Result<Comment[]>>;

  /**
   * Search comments with complex criteria
   */
  search(criteria: CommentSearchCriteria, options?: CommentSearchOptions): Promise<Result<CommentSearchResult>>;

  /**
   * Delete a comment
   */
  delete(id: CommentId): Promise<Result<void>>;

  /**
   * Count comments by criteria
   */
  count(criteria?: CommentSearchCriteria): Promise<Result<number>>;

  /**
   * Check if a comment exists
   */
  exists(id: CommentId): Promise<Result<boolean>>;

  /**
   * Get comment thread (comment with replies)
   */
  getThread(commentId: CommentId): Promise<Result<Comment | null>>;
}
