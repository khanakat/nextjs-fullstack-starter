import { CommandHandler } from '../../base/command-handler';
import { CreateCommentCommand } from '../commands/create-comment.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { CommentContent } from '../../../domain/comments/value-objects/comment-content.vo';
import { CommentPosition } from '../../../domain/comments/value-objects/comment-position.vo';
import { Result } from '../../base/result';

export class CreateCommentHandler extends CommandHandler<CreateCommentCommand, Comment> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(command: CreateCommentCommand): Promise<Result<Comment>> {
    const content = CommentContent.create(command.content);
    const position = command.position ? CommentPosition.create(command.position) : undefined;

    const comment = Comment.create({
      documentId: command.documentId,
      authorId: command.authorId,
      authorName: command.authorName,
      content,
      contentType: command.contentType,
      position,
      parentId: command.parentId,
      metadata: command.metadata,
    });

    const saveResult = await this.commentRepository.save(comment);
    if (saveResult.isFailure) {
      return Result.failure<Comment>(saveResult.error);
    }

    return Result.success<Comment>(comment);
  }
}
