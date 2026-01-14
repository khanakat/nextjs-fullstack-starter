import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WebhooksApiController } from '@/slices/integrations/presentation/api/webhooks-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/integrations/webhooks - List webhooks for organization
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user ID and organization ID to request headers for handler to use
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);

    // For now, we'll need to fetch the organization ID from the user
    // In production, this should come from a middleware or auth context
    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.listWebhooks(requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to list webhooks:', error);
    return Response.json(
      { error: 'Failed to list webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/webhooks - Create new webhook
 */
export async function POST(request: NextRequest) {
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

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.createWebhook(requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to create webhook:', error);
    return Response.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
