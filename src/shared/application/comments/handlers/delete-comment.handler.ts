import { CommandHandler } from '../../base/command-handler';
import { DeleteCommentCommand } from '../commands/delete-comment.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class DeleteCommentHandler implements CommandHandler<DeleteCommentCommand> {
  constructor(private commentRepository: ICommentRepository) {}

  async handle(command: DeleteCommentCommand): Promise<Result<void>> {
    const commentResult = await this.commentRepository.findById(command.commentId);

    if (commentResult.isFailure || !commentResult.value) {
      return Result.failure<void>(commentResult.error || 'Comment not found');
    }

    const comment = commentResult.value;

    // Check if comment has replies (would need to check repository)
    // For now, always hard delete
    comment.hardDelete();

    // First save the domain event
    await this.commentRepository.save(comment);

    // Then perform actual delete
    return this.commentRepository.delete(command.commentId);
  }
}
