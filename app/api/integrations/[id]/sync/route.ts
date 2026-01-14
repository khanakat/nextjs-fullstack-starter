import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { IntegrationsApiController } from '@/slices/integrations/presentation/api/integrations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * POST /api/integrations/[id]/sync - Trigger data synchronization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user ID to request headers for handler to use
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<IntegrationsApiController>(TYPES.IntegrationsApiController);
    return controller.syncIntegration(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to sync integration:', error);
    return Response.json(
      { error: 'Failed to sync integration' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/[id]/sync - Get sync status and history
 * TODO: Implement sync status query and handler
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement GetSyncStatusQuery and handler
    // For now, return empty response
    return Response.json({
      integrationId: params.id,
      currentSync: null,
      syncHistory: [],
      connections: [],
      lastSync: null,
    });
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return Response.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
