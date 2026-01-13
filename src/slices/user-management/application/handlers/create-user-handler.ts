import { injectable, inject } from 'inversify';
import { CommandHandler } from '@/shared/application/base/command-handler';
import { Result } from '@/shared/application/base/result';
import { CreateUserCommand } from '../commands/create-user-command';
import { UserDto } from '../dtos/user-dto';
import type { IUserRepository } from '../../domain/repositories/user-repository';
import { User, UserRole } from '../../domain/entities/user';
import { Email } from '@/shared/domain/value-objects/email';
import { ValidationError } from '@/shared/domain/exceptions/validation-error';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Create User Command Handler
 * Handles the creation of new users
 */
@injectable()
export class CreateUserHandler extends CommandHandler<CreateUserCommand, UserDto> {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository
  ) {
    super();
  }

  async handle(command: CreateUserCommand): Promise<Result<UserDto>> {
    try {
      const { props } = command;

      // Validate email format
      const email = Email.create(props.email);

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return Result.failure(new ValidationError('email', 'user with this email already exists'));
      }

      // Check username uniqueness if provided
      if (props.username) {
        const existingUsername = await this.userRepository.existsByUsername(props.username);
        if (existingUsername) {
          return Result.failure(new ValidationError('username', 'username is already taken'));
        }
      }

      // Create user entity
      const user = User.create({
        clerkId: props.clerkId,
        email,
        name: props.name,
        username: props.username,
        imageUrl: props.imageUrl,
        bio: props.bio,
        location: props.location,
        website: props.website,
        role: (props.role as UserRole) || UserRole.MEMBER,
      });

      // Save user
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