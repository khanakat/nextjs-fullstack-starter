import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { BaseController } from '@/shared/presentation/api/base-controller';
import { CreateUserCommand } from '../../application/commands/create-user-command';
import { UpdateUserCommand } from '../../application/commands/update-user-command';
import { GetUserQuery } from '../../application/queries/get-user-query';
import { GetUsersQuery } from '../../application/queries/get-users-query';
import { CreateUserHandler } from '../../application/handlers/create-user-handler';
import { UpdateUserHandler } from '../../application/handlers/update-user-handler';
import { GetUserHandler } from '../../application/handlers/get-user-handler';
import { GetUsersHandler } from '../../application/handlers/get-users-handler';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Users API Controller
 * Handles HTTP requests for user management
 */
@injectable()
export class UsersController extends BaseController {
  constructor(
    @inject(TYPES.CreateUserHandler) private createUserHandler: CreateUserHandler,
    @inject(TYPES.UpdateUserHandler) private updateUserHandler: UpdateUserHandler,
    @inject(TYPES.GetUserHandler) private getUserHandler: GetUserHandler,
    @inject(TYPES.GetUsersHandler) private getUsersHandler: GetUsersHandler
  ) {
    super();
  }

  /**
   * GET /api/users
   * Get users with pagination and filtering
   */
  async getUsers(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      
      const query = new GetUsersQuery({
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        search: searchParams.get('search') || undefined,
        role: searchParams.get('role') || undefined,
      });

      const result = await this.getUsersHandler.handle(query);

      if (result.isFailure) {
        return this.handleError(result.error);
      }

      return this.ok(result.value);
    } catch (error) {
      return this.handleError(error as Error);
    }
  }

  /**
   * GET /api/users/[id]
   * Get user by ID
   */
  async getUser(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const query = new GetUserQuery({
        userId: params.id,
      });

      const result = await this.getUserHandler.handle(query);

      if (result.isFailure) {
        return this.handleError(result.error);
      }

      return this.ok(result.value);
    } catch (error) {
      return this.handleError(error as Error);
    }
  }

  /**
   * POST /api/users
   * Create a new user
   */
  async createUser(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new CreateUserCommand({
        clerkId: body.clerkId,
        email: body.email,
        name: body.name,
        username: body.username,
        imageUrl: body.imageUrl,
        bio: body.bio,
        location: body.location,
        website: body.website,
        role: body.role,
      });

      const result = await this.createUserHandler.handle(command);

      if (result.isFailure) {
        return this.handleError(result.error);
      }

      return this.created(result.value);
    } catch (error) {
      return this.handleError(error as Error);
    }
  }

  /**
   * PUT /api/users/[id]
   * Update user profile
   */
  async updateUser(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const body = await request.json();

      const command = new UpdateUserCommand({
        userId: params.id,
        name: body.name,
        username: body.username,
        bio: body.bio,
        location: body.location,
        website: body.website,
        imageUrl: body.imageUrl,
      });

      const result = await this.updateUserHandler.handle(command);

      if (result.isFailure) {
        return this.handleError(result.error);
      }

      return this.ok(result.value);
    } catch (error) {
      return this.handleError(error as Error);
    }
  }
}