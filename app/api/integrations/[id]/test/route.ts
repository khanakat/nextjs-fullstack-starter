import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { IntegrationsApiController } from '@/slices/integrations/presentation/api/integrations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * POST /api/integrations/[id]/test - Test integration connection
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
    return controller.testIntegration(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to test integration:', error);
    return Response.json(
      { error: 'Failed to test integration' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/[id]/test - Get test history
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

    const controller = DIContainer.get<IntegrationsApiController>(TYPES.IntegrationsApiController);
    return controller.getTestHistory(params.id, request);
  } catch (error) {
    console.error('Failed to get test history:', error);
    return Response.json(
      { error: 'Failed to get test history' },
      { status: 500 }
    );
  }
}
