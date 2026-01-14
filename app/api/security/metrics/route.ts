import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { SecurityApiController } from '@/slices/security/presentation/api/security-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';
import { MembershipService } from '@/lib/services/organization-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/security/metrics - Get security metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return Response.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to the organization
    const hasAccess = await MembershipService.hasUserAccess(organizationId, userId);
    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const controller = DIContainer.get<SecurityApiController>(TYPES.SecurityApiController);
    return controller.getSecurityMetrics(request);
  } catch (error) {
    console.error('Failed to get security metrics:', error);
    return Response.json(
      { error: 'Failed to get security metrics' },
      { status: 500 }
    );
  }
}
