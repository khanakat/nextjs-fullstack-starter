import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { LoginCommand } from '../commands/login-command';
import { LoginUserHandler } from '../handlers/login-user-handler';
import { Result } from '../../../../shared/application/base/result';
import { AuthResponseDto } from '../dtos/auth-response-dto';

/**
 * Login User Use Case
 * 
 * Use case for user login.
 * Orchestrates login command handler and provides
 * a clean interface for the application layer.
 */
@injectable()
export class LoginUserUseCase implements IUseCase<LoginCommand, AuthResponseDto> {
  constructor(
    @inject('LoginUserHandler') private readonly handler: LoginUserHandler
  ) {}

  /**
   * Execute login user use case
   */
  async execute(command: LoginCommand): Promise<Result<AuthResponseDto>> {
    return await this.handler.handle(command);
  }
}
