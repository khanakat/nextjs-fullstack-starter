import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { LoginCommand } from '../commands/login-command';
import type { IAuthService } from '../../domain/services/auth-service';
import { TYPES } from '@/shared/infrastructure/di/types';
import { UserDto } from '../dtos/user-dto';
import { AuthResponseDto } from '../dtos/auth-response-dto';
import { User } from '../../domain/entities/user';

/**
 * Login User Command Handler
 * 
 * Handles user login with email and password.
 * Validates credentials, creates session, and returns auth response.
 */
@injectable()
export class LoginUserHandler extends CommandHandler<LoginCommand, AuthResponseDto> {
  constructor(
    @inject(TYPES.AuthService) private readonly authService: IAuthService
  ) {
    super();
  }

  /**
   * Handle login user command
   */
  async handle(command: LoginCommand): Promise<Result<AuthResponseDto>> {
    return await this.handleWithValidation(command, async (cmd) => {
      const authResult = await this.authService.login(
        cmd.props.email,
        cmd.props.password,
        cmd.props.ipAddress,
        cmd.props.userAgent
      );

      return {
        user: this.toUserDto(authResult.user),
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
      };
    });
  }

  /**
   * Convert User entity to DTO
   */
  private toUserDto(user: User): UserDto {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
