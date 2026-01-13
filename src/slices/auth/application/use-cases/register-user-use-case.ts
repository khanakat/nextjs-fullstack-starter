import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { RegisterUserCommand } from '../commands/register-user-command';
import { RegisterUserHandler } from '../handlers/register-user-handler';
import { TYPES } from '@/shared/infrastructure/di/types';
import { Result } from '../../../../shared/application/base/result';
import { UserDto } from '../dtos/user-dto';

/**
 * Register User Use Case
 * 
 * Use case for user registration.
 * Orchestrates the registration command handler and provides
 * a clean interface for the application layer.
 */
@injectable()
export class RegisterUserUseCase implements IUseCase<RegisterUserCommand, UserDto> {
  constructor(
    @inject(TYPES.RegisterUserHandler) private readonly handler: RegisterUserHandler
  ) {}

  /**
   * Execute register user use case
   */
  async execute(command: RegisterUserCommand): Promise<Result<UserDto>> {
    return await this.handler.handle(command);
  }
}
