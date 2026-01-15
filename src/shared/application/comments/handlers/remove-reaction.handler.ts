import { CommandHandler } from '../../base/command-handler';
import { RemoveReactionCommand } from '../commands/remove-reaction.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class RemoveReactionHandler extends CommandHandler<RemoveReactionCommand, Comment> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(command: RemoveReactionCommand): Promise<Result<Comment>> {
    const commentResult = await this.commentRepository.findById(command.commentId);

    if (commentResult.isFailure || !commentResult.value) {
      return Result.failure<Comment>(new Error('Comment not found'));
    }

    const comment = commentResult.value;
    comment.removeReaction(command.emoji, command.userId);

    const saveResult = await this.commentRepository.save(comment);
    if (saveResult.isFailure) {
      return Result.failure<Comment>(saveResult.error);
    }

    return Result.success<Comment>(comment);
  }
}
