import { ICommentRepository, CommentSearchCriteria, CommentSearchOptions, CommentSearchResult } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { CommentId } from '../../../domain/comments/value-objects/comment-id.vo';
import { CommentContent } from '../../../domain/comments/value-objects/comment-content.vo';
import { CommentPosition } from '../../../domain/comments/value-objects/comment-position.vo';
import { UniqueId } from '../../../domain/value-objects/unique-id';
import { Result } from '../../../application/base/result';
import { prisma } from '@/lib/prisma';

/**
 * Prisma implementation of ICommentRepository
 * Handles data persistence for Comment aggregate using Prisma ORM
 */
export class PrismaCommentRepository implements ICommentRepository {
  async save(comment: Comment): Promise<Result<void>> {
    const commentData = this.toPrismaModel(comment);

    try {
      await prisma.documentComment.upsert({
        where: { id: comment.id.id },
        update: commentData,
        create: {
          id: comment.id.id,
          ...commentData,
        },
      });

      return Result.success<void>(undefined);
    } catch (error) {
      return Result.failure<void>(new Error(`Failed to save comment: ${error}`));
    }
  }

  async findById(id: CommentId): Promise<Result<Comment | null>> {
    try {
      const model = await prisma.documentComment.findUnique({
        where: { id: id.id },
      });

      if (!model) {
        return Result.success<Comment | null>(null);
      }

      const comment = await this.toDomainModel(model);
      return Result.success<Comment | null>(comment);
    } catch (error) {
      return Result.failure<Comment | null>(new Error(`Failed to find comment: ${error}`));
    }
  }

  async findByDocumentId(
    documentId: UniqueId,
    options?: CommentSearchOptions
  ): Promise<Result<CommentSearchResult>> {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    try {
      const [models, total] = await Promise.all([
        prisma.documentComment.findMany({
          where: { documentId: documentId.id },
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.documentComment.count({ where: { documentId: documentId.id } }),
      ]);

      const comments = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return Result.success<CommentSearchResult>({
        comments,
        total,
        hasMore: offset + limit < total,
      });
    } catch (error) {
      return Result.failure<CommentSearchResult>(new Error(`Failed to find comments: ${error}`));
    }
  }

  async findByIds(ids: CommentId[]): Promise<Result<Comment[]>> {
    try {
      const models = await prisma.documentComment.findMany({
        where: {
          id: { in: ids.map((id) => id.id) },
        },
      });

      const comments = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return Result.success<Comment[]>(comments);
    } catch (error) {
      return Result.failure<Comment[]>(new Error(`Failed to find comments: ${error}`));
    }
  }

  async findByAuthor(authorId: string, options?: CommentSearchOptions): Promise<Result<CommentSearchResult>> {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    try {
      const [models, total] = await Promise.all([
        prisma.documentComment.findMany({
          where: { authorId },
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.documentComment.count({ where: { authorId } }),
      ]);

      const comments = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return Result.success<CommentSearchResult>({
        comments,
        total,
        hasMore: offset + limit < total,
      });
    } catch (error) {
      return Result.failure<CommentSearchResult>(new Error(`Failed to find comments: ${error}`));
    }
  }

  async findByParentId(parentId: CommentId, options?: CommentSearchOptions): Promise<Result<Comment[]>> {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'asc' } = options || {};

    try {
      const models = await prisma.documentComment.findMany({
        where: { parentId: parentId.id },
        take: limit,
        skip: offset,
        orderBy: { [sortBy]: sortOrder },
      });

      const comments = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return Result.success<Comment[]>(comments);
    } catch (error) {
      return Result.failure<Comment[]>(new Error(`Failed to find comments: ${error}`));
    }
  }

  async findTopLevelByDocument(
    documentId: UniqueId,
    options?: CommentSearchOptions
  ): Promise<Result<Comment[]>> {
    const { limit = 50, offset = 0 } = options || {};

    try {
      const models = await prisma.documentComment.findMany({
        where: {
          documentId: documentId.id,
          parentId: null,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      const comments = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return Result.success<Comment[]>(comments);
    } catch (error) {
      return Result.failure<Comment[]>(new Error(`Failed to find comments: ${error}`));
    }
  }

  async search(criteria: CommentSearchCriteria, options?: CommentSearchOptions): Promise<Result<CommentSearchResult>> {
    const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options || {};

    const where: any = {};

    if (criteria.documentId) {
      where.documentId = criteria.documentId.id;
    }

    if (criteria.authorId) {
      where.authorId = criteria.authorId;
    }

    if (criteria.parentId) {
      where.parentId = criteria.parentId.id;
    }

    if (criteria.resolved !== undefined) {
      where.resolved = criteria.resolved;
    }

    try {
      const [models, total] = await Promise.all([
        prisma.documentComment.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.documentComment.count({ where }),
      ]);

      const comments = await Promise.all(models.map((model) => this.toDomainModel(model)));

      return Result.success<CommentSearchResult>({
        comments,
        total,
        hasMore: offset + limit < total,
      });
    } catch (error) {
      return Result.failure<CommentSearchResult>(new Error(`Failed to search comments: ${error}`));
    }
  }

  async delete(id: CommentId): Promise<Result<void>> {
    try {
      await prisma.documentComment.delete({
        where: { id: id.id },
      });

      return Result.success<void>(undefined);
    } catch (error) {
      return Result.failure<void>(new Error(`Failed to delete comment: ${error}`));
    }
  }

  async count(criteria?: CommentSearchCriteria): Promise<Result<number>> {
    try {
      const where: any = {};

      if (criteria?.documentId) {
        where.documentId = criteria.documentId.id;
      }

      if (criteria?.authorId) {
        where.authorId = criteria.authorId;
      }

      if (criteria?.parentId) {
        where.parentId = criteria.parentId.id;
      }

      if (criteria?.resolved !== undefined) {
        where.resolved = criteria.resolved;
      }

      const total = await prisma.documentComment.count({ where });

      return Result.success<number>(total);
    } catch (error) {
      return Result.failure<number>(new Error(`Failed to count comments: ${error}`));
    }
  }

  async exists(id: CommentId): Promise<Result<boolean>> {
    try {
      const count = await prisma.documentComment.count({
        where: { id: id.id },
      });

      return Result.success<boolean>(count > 0);
    } catch (error) {
      return Result.failure<boolean>(new Error(`Failed to check comment existence: ${error}`));
    }
  }

  async getThread(commentId: CommentId): Promise<Result<Comment | null>> {
    try {
      const model = await prisma.documentComment.findUnique({
        where: { id: commentId.id },
        include: {
          replies: true,
        },
      });

      if (!model) {
        return Result.success<Comment | null>(null);
      }

      const comment = await this.toDomainModel(model);
      return Result.success<Comment | null>(comment);
    } catch (error) {
      return Result.failure<Comment | null>(new Error(`Failed to get comment thread: ${error}`));
    }
  }

  /**
   * Convert domain model to Prisma model
   */
  private toPrismaModel(comment: Comment): any {
    return {
      documentId: comment.documentId.id,
      authorId: comment.authorId,
      authorName: comment.authorName,
      content: comment.content.value,
      contentType: comment.contentType,
      position: comment.position?.toJSON(),
      parentId: comment.parentId?.id,
      resolved: comment.resolved,
      reactions: JSON.stringify(Object.fromEntries(comment.reactions)),
      metadata: comment.metadata,
      deletedAt: comment.deletedAt,
      updatedAt: comment.updatedAt,
    };
  }

  /**
   * Convert Prisma model to domain model
   */
  private async toDomainModel(model: any): Promise<Comment> {
    const content = CommentContent.create(model.content);
    const position = model.position ? CommentPosition.create(model.position) : undefined;

    // Parse reactions from JSON
    const reactionsMap = new Map<string, string[]>();
    if (model.reactions) {
      try {
        const reactionsObj = JSON.parse(model.reactions);
        Object.entries(reactionsObj).forEach(([emoji, users]) => {
          reactionsMap.set(emoji, users as string[]);
        });
      } catch (e) {
        // If parsing fails, start with empty map
      }
    }

    return Comment.reconstitute(
      CommentId.create(model.id),
      {
        id: CommentId.create(model.id),
        documentId: UniqueId.create(model.documentId),
        authorId: model.authorId,
        authorName: model.authorName,
        content,
        contentType: model.contentType,
        position,
        parentId: model.parentId ? CommentId.create(model.parentId) : undefined,
        resolved: model.resolved || model.isResolved || false,
        reactions: reactionsMap,
        metadata: model.metadata,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        deletedAt: model.deletedAt,
      }
    );
  }
}
