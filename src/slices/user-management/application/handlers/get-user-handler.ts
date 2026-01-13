import { injectable, inject } from 'inversify';
import { QueryHandler } from '@/shared/application/base/query-handler';
import { Result } from '@/shared/application/base/result';
import { GetUserQuery } from '../queries/get-user-query';
import { UserDto } from '../dtos/user-dto';
import type { IUserRepository } from '../../domain/repositories/user-repository';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { NotFoundError } from '@/shared/domain/exceptions/not-found-error';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Get User Query Handler
 * Handles retrieving a user by ID
 */
@injectable()
export class GetUserHandler extends QueryHandler<GetUserQuery, UserDto> {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository
  ) {
    super();
  }

  async handle(query: GetUserQuery): Promise<Result<UserDto>> {
    try {
      const { props } = query;

      // Find user
      const userId = UniqueId.create(props.userId);
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return Result.failure(new NotFoundError('User', props.userId));
      }

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