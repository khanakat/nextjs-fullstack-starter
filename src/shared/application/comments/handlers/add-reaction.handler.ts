import { CommandHandler } from '../../base/command-handler';
import { AddReactionCommand } from '../commands/add-reaction.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class AddReactionHandler implements CommandHandler<AddReactionCommand> {
  constructor(private commentRepository: ICommentRepository) {}

  async handle(command: AddReactionCommand): Promise<Result<Comment>> {
    const commentResult = await this.commentRepository.findById(command.commentId);

    if (commentResult.isFailure || !commentResult.value) {
      return Result.failure<Comment>(commentResult.error || 'Comment not found');
    }

    const comment = commentResult.value;
    comment.addReaction(command.emoji, command.userId);

    return this.commentRepository.save(comment);
  }
}
