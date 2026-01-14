import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { IntegrationsApiController } from '@/slices/integrations/presentation/api/integrations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * POST /api/integrations/[id]/connect - Initiate connection for integration
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

    // Add user ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<IntegrationsApiController>(TYPES.IntegrationsApiController);
    return controller.connectIntegration(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to connect integration:', error);
    return Response.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/[id]/connect - Get connection status
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

    // TODO: Get organization ID from user context
    // For now, we'll pass it via query param or fetch it in the handler

    const controller = DIContainer.get<IntegrationsApiController>(TYPES.IntegrationsApiController);
    return controller.getConnectionStatus(params.id, request);
  } catch (error) {
    console.error('Failed to get connection status:', error);
    return Response.json(
      { error: 'Failed to get connection status' },
      { status: 500 }
    );
  }
}
