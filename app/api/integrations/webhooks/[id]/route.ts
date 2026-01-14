import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WebhooksApiController } from '@/slices/integrations/presentation/api/webhooks-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/integrations/webhooks/[id] - Get webhook by ID
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

    // Add organization ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);
    // TODO: Get organization ID from user context

    const requestWithHeaders = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.getWebhook(params.id, requestWithHeaders as NextRequest);
  } catch (error) {
    console.error('Failed to get webhook:', error);
    return Response.json(
      { error: 'Failed to get webhook' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/webhooks/[id] - Update webhook
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

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.updateWebhook(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to update webhook:', error);
    return Response.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/webhooks/[id] - Delete webhook
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

    // Add user ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.deleteWebhook(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return Response.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
