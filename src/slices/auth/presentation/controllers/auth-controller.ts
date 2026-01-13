import { injectable, inject } from 'inversify';
import { BaseController } from '../../../../shared/presentation/base/base-controller';
import { RegisterUserUseCase } from '../../application/use-cases/register-user-use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user-use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user-use-case';
import { RegisterUserCommand } from '../../application/commands/register-user-command';
import { LoginCommand } from '../../application/commands/login-command';
import { GetUserQuery } from '../../application/queries/get-user-query';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Auth Controller
 * 
 * Controller for authentication operations.
 * Handles HTTP requests and delegates to use cases.
 */
@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject('RegisterUserUseCase') private readonly registerUserUseCase: RegisterUserUseCase,
    @inject('LoginUserUseCase') private readonly loginUserUseCase: LoginUserUseCase,
    @inject('GetUserUseCase') private readonly getUserUseCase: GetUserUseCase
  ) {
    super();
  }

  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const command = new RegisterUserCommand({
        email: body.email,
        password: body.password,
        name: body.name,
        username: body.username,
      });

      const result = await this.registerUserUseCase.execute(command);

      if (result.isSuccess) {
        return new Response(JSON.stringify({
          success: true,
          user: result.value,
        }), { status: 201 });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.isFailure ? result.error?.message : 'Registration failed',
        }), { status: 400 });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const command = new LoginCommand({
        email: body.email,
        password: body.password,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      });

      const result = await this.loginUserUseCase.execute(command);

      if (result.isSuccess) {
        return new Response(JSON.stringify({
          success: true,
          user: result.value.user,
          accessToken: result.value.session?.accessToken,
          refreshToken: result.value.session?.refreshToken,
        }), { status: 200 });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.isFailure ? result.error?.message : 'Login failed',
        }), { status: 401 });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }), { status: 401 });
      }

      const query = new GetUserQuery({ userId });
      const result = await this.getUserUseCase.execute(query);

      if (result.isSuccess) {
        return new Response(JSON.stringify({
          success: true,
          user: result.value,
        }), { status: 200 });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.isFailure ? result.error?.message : 'User not found',
        }), { status: 404 });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });
    }
  }

  /**
   * Get user by ID
   * GET /api/auth/users/:id
   */
  async getUser(req: Request): Promise<Response> {
    try {
      const userId = req.url.split('/').pop() || '';
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User ID is required',
        }), { status: 400 });
      }

      const query = new GetUserQuery({ userId });
      const result = await this.getUserUseCase.execute(query);

      if (result.isSuccess) {
        return new Response(JSON.stringify({
          success: true,
          user: result.value,
        }), { status: 200 });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.isFailure ? result.error?.message : 'User not found',
        }), { status: 404 });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      if (!userId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }), { status: 401 });
      }

      // TODO: Implement logout use case
      return new Response(JSON.stringify({
        success: true,
      }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), { status: 500 });
    }
  }

  /**
   * Extract user ID from request
   * This is a simplified implementation that would typically
   * use JWT from NextAuth/Clerk in production
   */
  private extractUserId(req: Request): string | undefined {
    // In production, this would extract from JWT token
    // For now, return undefined to indicate unauthenticated
    return undefined;
  }
}
