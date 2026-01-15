import { CommandHandler } from '../../base/command-handler';
import { UpdateCommentCommand } from '../commands/update-comment.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class UpdateCommentHandler extends CommandHandler<UpdateCommentCommand, Comment> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(command: UpdateCommentCommand): Promise<Result<Comment>> {
    const commentResult = await this.commentRepository.findById(command.commentId);

    if (commentResult.isFailure || !commentResult.value) {
      return Result.failure<Comment>(new Error('Comment not found'));
    }

    const comment = commentResult.value;

    if (command.content !== undefined) {
      comment.updateContent(command.content);
    }

    if (command.resolved !== undefined) {
      if (command.resolved) {
        comment.resolve();
      } else {
        comment.unresolve();
      }
    }

    if (command.metadata) {
      comment.updateMetadata(command.metadata);
    }

    const saveResult = await this.commentRepository.save(comment);
    if (saveResult.isFailure) {
      return Result.failure<Comment>(saveResult.error);
    }

    return Result.success<Comment>(comment);
  }
}
