import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { RegisterUserCommand } from '../commands/register-user-command';
import type { IAuthService } from '../../domain/services/auth-service';
import { TYPES } from '@/shared/infrastructure/di/types';
import { User } from '../../domain/entities/user';
import { UserDto } from '../dtos/user-dto';

/**
 * Register User Command Handler
 * 
 * Handles the registration of a new user account.
 * Validates input, creates user, and returns a Result with UserDto.
 */
@injectable()
export class RegisterUserHandler extends CommandHandler<RegisterUserCommand, UserDto> {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: IAuthService
  ) {
    super();
  }

  /**
   * Handle register user command
   */
  async handle(command: RegisterUserCommand): Promise<Result<UserDto>> {
    return await this.handleWithValidation(command, async (cmd) => {
      const user = await this.authService.register(
        cmd.props.email,
        cmd.props.password,
        cmd.props.name,
        cmd.props.username
      );

      return this.toDto(user);
    });
  }

  /**
   * Convert User entity to DTO
   */
  private toDto(user: User): UserDto {
    return {
      id: user.id.value,
      clerkId: user.clerkId,
      email: user.email.toString(),
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      bio: user.bio,
      location: user.location,
      website: user.website,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: new Date(), // Would be stored in repository
      updatedAt: new Date(),
    };
  }
}
