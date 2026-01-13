import { injectable, inject } from 'inversify';
import { IQueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetUserQuery } from '../queries/get-user-query';
import type { IUserRepository } from '../../domain/repositories/user-repository';
import { TYPES } from '@/shared/infrastructure/di/types';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { User } from '../../domain/entities/user';
import { UserDto } from '../dtos/user-dto';

/**
 * Get User Query Handler
 * 
 * Handles the retrieval of a user by ID.
 */
@injectable()
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDto> {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository
  ) {}

  /**
   * Handle get user query
   */
  async handle(query: GetUserQuery): Promise<Result<UserDto>> {
    const userId = query.props.userId ? UniqueId.create(query.props.userId) : undefined;
    const user = userId ? await this.userRepository.findById(userId) : undefined;
    
    if (!user) {
      throw new Error('User not found');
    }

    return Result.success(this.toDto(user!));
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
