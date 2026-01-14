import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { IntegrationsApiController } from '@/slices/integrations/presentation/api/integrations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/integrations/[id] - Get integration by ID
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
    return controller.getIntegration(params.id);
  } catch (error) {
    console.error('Failed to get integration:', error);
    return Response.json(
      { error: 'Failed to get integration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/[id] - Update integration
 */
export async function PUT(
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
    return controller.updateIntegration(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to update integration:', error);
    return Response.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[id] - Delete integration
 */
export async function DELETE(
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
    return controller.deleteIntegration(params.id);
  } catch (error) {
    console.error('Failed to delete integration:', error);
    return Response.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
