import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId?: string;
  roles: string[];
}

export interface AuthContext {
  user: AuthenticatedUser;
  isAuthenticated: boolean;
}

/**
 * Authentication middleware for API requests
 */
export class AuthMiddleware {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  /**
   * Extract and validate JWT token from request
   */
  static async authenticate(request: NextRequest): Promise<{
    isAuthenticated: boolean;
    user?: AuthenticatedUser;
    error?: string;
  }> {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          isAuthenticated: false,
          error: 'Missing or invalid authorization header',
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!token) {
        return {
          isAuthenticated: false,
          error: 'Missing token',
        };
      }

      // Verify JWT token
      const decoded = verify(token, this.JWT_SECRET) as any;
      
      const user: AuthenticatedUser = {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        roles: decoded.roles || ['user'],
      };

      return {
        isAuthenticated: true,
        user,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      
      return {
        isAuthenticated: false,
        error: 'Invalid token',
      };
    }
  }

  /**
   * Check if user has required permissions
   */
  static hasPermission(
    user: AuthenticatedUser,
    requiredPermissions: string | string[]
  ): boolean {
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    // Admin users have all permissions
    if (user.roles.includes('admin')) {
      return true;
    }

    // Check if user has any of the required permissions
    return permissions.some(permission => user.roles.includes(permission));
  }

  /**
   * Check if user can access organization resources
   */
  static canAccessOrganization(
    user: AuthenticatedUser,
    organizationId?: string
  ): boolean {
    // Admin users can access any organization
    if (user.roles.includes('admin')) {
      return true;
    }

    // If no organization specified, allow access
    if (!organizationId) {
      return true;
    }

    // User must belong to the same organization
    return user.organizationId === organizationId;
  }

  /**
   * Check if user can access resource owned by another user
   */
  static canAccessUserResource(
    user: AuthenticatedUser,
    resourceOwnerId: string,
    organizationId?: string
  ): boolean {
    // User can access their own resources
    if (user.id === resourceOwnerId) {
      return true;
    }

    // Admin users can access any resource
    if (user.roles.includes('admin')) {
      return true;
    }

    // Organization managers can access resources within their organization
    if (user.roles.includes('org-manager') && organizationId) {
      return this.canAccessOrganization(user, organizationId);
    }

    return false;
  }

  /**
   * Create authentication error response
   */
  static createAuthErrorResponse(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }

  /**
   * Create permission error response
   */
  static createPermissionErrorResponse(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json(
      { error: message },
      { status: 403 }
    );
  }

  /**
   * Middleware wrapper for authentication
   */
  static withAuth(
    options: {
      requiredPermissions?: string | string[];
      allowPublic?: boolean;
    } = {}
  ) {
    return function (
      handler: (
        request: NextRequest,
        context: { auth: AuthContext; params?: any }
      ) => Promise<NextResponse>
    ) {
      return async function (
        request: NextRequest,
        { params }: { params?: any } = {}
      ): Promise<NextResponse> {
        // Skip authentication for public endpoints
        if (options.allowPublic) {
          const authResult = await AuthMiddleware.authenticate(request);
          const authContext: AuthContext = {
            isAuthenticated: authResult.isAuthenticated,
            user: authResult.user || {
              id: 'anonymous',
              email: '',
              roles: ['anonymous'],
            },
          };

          return handler(request, { auth: authContext, params });
        }

        // Authenticate user
        const authResult = await AuthMiddleware.authenticate(request);
        
        if (!authResult.isAuthenticated || !authResult.user) {
          return AuthMiddleware.createAuthErrorResponse(authResult.error);
        }

        // Check permissions if required
        if (options.requiredPermissions) {
          if (!AuthMiddleware.hasPermission(authResult.user, options.requiredPermissions)) {
            return AuthMiddleware.createPermissionErrorResponse(
              'Insufficient permissions'
            );
          }
        }

        const authContext: AuthContext = {
          isAuthenticated: true,
          user: authResult.user,
        };

        return handler(request, { auth: authContext, params });
      };
    };
  }

  /**
   * Middleware wrapper for organization-based access control
   */
  static withOrganizationAccess() {
    return function (
      handler: (
        request: NextRequest,
        context: { auth: AuthContext; params?: any }
      ) => Promise<NextResponse>
    ) {
      return AuthMiddleware.withAuth()(async function (
        request: NextRequest,
        context: { auth: AuthContext; params?: any }
      ): Promise<NextResponse> {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId') || undefined;

        // Check organization access
        if (organizationId && !AuthMiddleware.canAccessOrganization(context.auth.user, organizationId)) {
          return AuthMiddleware.createPermissionErrorResponse(
            'Cannot access resources from this organization'
          );
        }

        return handler(request, context);
      });
    };
  }

  /**
   * Middleware wrapper for resource ownership validation
   */
  static withResourceOwnership(getResourceOwnerId: (params: any) => string) {
    return function (
      handler: (
        request: NextRequest,
        context: { auth: AuthContext; params?: any }
      ) => Promise<NextResponse>
    ) {
      return AuthMiddleware.withAuth()(async function (
        request: NextRequest,
        context: { auth: AuthContext; params?: any }
      ): Promise<NextResponse> {
        const resourceOwnerId = getResourceOwnerId(context.params);
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId') || undefined;

        // Check resource access
        if (!AuthMiddleware.canAccessUserResource(
          context.auth.user,
          resourceOwnerId,
          organizationId
        )) {
          return AuthMiddleware.createPermissionErrorResponse(
            'Cannot access this resource'
          );
        }

        return handler(request, context);
      });
    };
  }
}

// Common permission constants
export const Permissions = {
  // Report permissions
  REPORTS_READ: 'reports:read',
  REPORTS_WRITE: 'reports:write',
  REPORTS_DELETE: 'reports:delete',
  REPORTS_PUBLISH: 'reports:publish',
  REPORTS_EXPORT: 'reports:export',

  // Template permissions
  TEMPLATES_READ: 'templates:read',
  TEMPLATES_WRITE: 'templates:write',
  TEMPLATES_DELETE: 'templates:delete',
  TEMPLATES_PUBLISH: 'templates:publish',

  // Scheduled report permissions
  SCHEDULED_REPORTS_READ: 'scheduled-reports:read',
  SCHEDULED_REPORTS_WRITE: 'scheduled-reports:write',
  SCHEDULED_REPORTS_DELETE: 'scheduled-reports:delete',
  SCHEDULED_REPORTS_EXECUTE: 'scheduled-reports:execute',

  // Export permissions
  EXPORTS_READ: 'exports:read',
  EXPORTS_DOWNLOAD: 'exports:download',
  EXPORTS_DELETE: 'exports:delete',

  // Admin permissions
  ADMIN_ALL: 'admin:all',
  ORG_MANAGE: 'org:manage',
} as const;