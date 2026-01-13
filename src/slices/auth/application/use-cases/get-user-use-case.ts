import { injectable, inject } from 'inversify';
import { IUseCase } from '../../../../shared/application/base/use-case';
import { GetUserQuery } from '../queries/get-user-query';
import { GetUserHandler } from '../handlers/get-user-handler';
import { Result } from '../../../../shared/application/base/result';
import { UserDto } from '../dtos/user-dto';

/**
 * Get User Use Case
 * 
 * Use case for retrieving a user by ID.
 * Orchestrates the get user query handler.
 */
@injectable()
export class GetUserUseCase implements IUseCase<GetUserQuery, UserDto> {
  constructor(
    @inject('GetUserHandler') private readonly handler: GetUserHandler
  ) {}

  /**
   * Execute get user use case
   */
  async execute(query: GetUserQuery): Promise<Result<UserDto>> {
    return await this.handler.handle(query);
  }
}
