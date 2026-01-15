import { CommandHandler } from '../../base/command-handler';
import { AddReactionCommand } from '../commands/add-reaction.command';
import { ICommentRepository } from '../../../domain/comments/repositories/icomment.repository';
import { Comment } from '../../../domain/comments/entities/comment.entity';
import { Result } from '../../base/result';

export class AddReactionHandler extends CommandHandler<AddReactionCommand, Comment> {
  constructor(private commentRepository: ICommentRepository) {
    super();
  }

  async handle(command: AddReactionCommand): Promise<Result<Comment>> {
    const commentResult = await this.commentRepository.findById(command.commentId);

    if (commentResult.isFailure || !commentResult.value) {
      return Result.failure<Comment>(new Error('Comment not found'));
    }

    const comment = commentResult.value;
    comment.addReaction(command.emoji, command.userId);

    const saveResult = await this.commentRepository.save(comment);
    if (saveResult.isFailure) {
      return Result.failure<Comment>(saveResult.error);
    }

    return Result.success<Comment>(comment);
  }
}
