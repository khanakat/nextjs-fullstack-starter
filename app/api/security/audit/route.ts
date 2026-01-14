import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { SecurityApiController } from '@/slices/security/presentation/api/security-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/security/audit - Get audit data
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view audit logs
    const user = { id: userId, email: '', role: 'MEMBER' as const };
    if (!hasPermission(user, 'read', 'audit')) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const controller = DIContainer.get<SecurityApiController>(TYPES.SecurityApiController);
    return controller.getAuditData(request);
  } catch (error) {
    console.error('Failed to get audit data:', error);
    return Response.json(
      { error: 'Failed to get audit data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/audit - Manage audit data
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage audit
    const user = { id: userId, email: '', role: 'MEMBER' as const };
    if (!hasPermission(user, 'admin', 'audit')) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Add user ID to request headers for handler to use
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<SecurityApiController>(TYPES.SecurityApiController);
    return controller.manageAuditData(requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to manage audit data:', error);
    return Response.json(
      { error: 'Failed to manage audit data' },
      { status: 500 }
    );
  }
}
