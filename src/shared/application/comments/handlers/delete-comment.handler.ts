import { CommandHandler } from '../../base/command-handler';
import { DeleteCommentCommand } from '../commands/delete-comment.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class DeleteCommentHandler extends CommandHandler<DeleteCommentCommand, void> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(command: DeleteCommentCommand): Promise<Result<void>> {
    const commentResult = await this.commentRepository.findById(command.commentId);

    if (commentResult.isFailure || !commentResult.value) {
      return Result.failure<void>(new Error('Comment not found'));
    }

    const comment = commentResult.value;
    // Check if comment has replies (would need to check repository)
    // For now, always hard delete
    comment.hardDelete();

    // First save the domain event
    const saveResult = await this.commentRepository.save(comment);
    if (saveResult.isFailure) {
      return Result.failure<void>(saveResult.error);
    }

    // Then perform actual delete
    return this.commentRepository.delete(command.commentId);
  }
}
