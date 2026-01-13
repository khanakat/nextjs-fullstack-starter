import { injectable, inject } from 'inversify';
import { CommandHandler } from '@/shared/application/base/command-handler';
import { Result } from '@/shared/application/base/result';
import { UpdateUserCommand } from '../commands/update-user-command';
import { UserDto } from '../dtos/user-dto';
import type { IUserRepository } from '../../domain/repositories/user-repository';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { NotFoundError } from '@/shared/domain/exceptions/not-found-error';
import { ValidationError } from '@/shared/domain/exceptions/validation-error';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Update User Command Handler
 * Handles user profile updates
 */
@injectable()
export class UpdateUserHandler extends CommandHandler<UpdateUserCommand, UserDto> {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository
  ) {
    super();
  }

  async handle(command: UpdateUserCommand): Promise<Result<UserDto>> {
    try {
      const { props } = command;

      // Find user
      const userId = UniqueId.create(props.userId);
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return Result.failure(new NotFoundError('User', command.props.userId));
      }

      // Check username uniqueness if being updated
      if (props.username && props.username !== user.username) {
        const existingUsername = await this.userRepository.existsByUsername(props.username);
        if (existingUsername) {
          return Result.failure(new ValidationError('username', 'username is already taken'));
        }
      }

      // Update user profile
      user.updateProfile({
        name: props.name,
        username: props.username,
        bio: props.bio,
        location: props.location,
        website: props.website,
        imageUrl: props.imageUrl,
      });

      // Save updated user
      await this.userRepository.save(user);

      // Return DTO
      const userDto: UserDto = {
        id: user.id.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        username: user.username,
        imageUrl: user.imageUrl,
        bio: user.bio,
        location: user.location,
        website: user.website,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return Result.success(userDto);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}