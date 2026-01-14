import { CommandHandler } from '../../base/command-handler';
import { RemoveReactionCommand } from '../commands/remove-reaction.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class RemoveReactionHandler implements CommandHandler<RemoveReactionCommand> {
  constructor(private commentRepository: ICommentRepository) {}

  async handle(command: RemoveReactionCommand): Promise<Result<Comment>> {
    const commentResult = await this.commentRepository.findById(command.commentId);

    if (commentResult.isFailure || !commentResult.value) {
      return Result.failure<Comment>(commentResult.error || 'Comment not found');
    }

    const comment = commentResult.value;
    comment.removeReaction(command.emoji, command.userId);

    return this.commentRepository.save(comment);
  }
}
