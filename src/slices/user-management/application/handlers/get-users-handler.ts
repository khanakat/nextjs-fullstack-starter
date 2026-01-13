import { injectable, inject } from 'inversify';
import { QueryHandler } from '@/shared/application/base/query-handler';
import { Result } from '@/shared/application/base/result';
import { GetUsersQuery } from '../queries/get-users-query';
import { UserDto } from '../dtos/user-dto';
import { PaginatedResultDto } from '@/shared/application/base/dto';
import type { IUserRepository } from '../../domain/repositories/user-repository';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Get Users Query Handler
 * Handles retrieving users with pagination and filtering
 */
@injectable()
export class GetUsersHandler extends QueryHandler<GetUsersQuery, PaginatedResultDto<UserDto>> {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository
  ) {
    super();
  }

  async handle(query: GetUsersQuery): Promise<Result<PaginatedResultDto<UserDto>>> {
    try {
      const { props } = query;

      // Get users with pagination
      const result = await this.userRepository.findMany({
        page: props.page || 1,
        limit: props.limit || 10,
        search: props.search,
        role: props.role,
      });

      // Convert to DTOs
      const userDtos: UserDto[] = result.users.map(user => ({
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
    }));

      // Return paginated response
      const response: PaginatedResultDto<UserDto> = {
        data: userDtos,
        total: result.total,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrevious: result.page > 1,
        },
      };

      return Result.success(response);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}