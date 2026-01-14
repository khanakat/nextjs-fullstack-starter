import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WebhooksApiController } from '@/slices/integrations/presentation/api/webhooks-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * POST /api/integrations/webhooks/[id]/process - Process incoming webhook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const webhookId = params.id;

    // This endpoint is called by external services, so it may not have user authentication
    // TODO: Implement webhook signature verification for security

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.processWebhook(webhookId, request);
  } catch (error) {
    console.error('Failed to process webhook:', error);
    return Response.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/webhooks/[id]/process - Get webhook processing status
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
    return controller.getWebhookDeliveries(params.id, requestWithHeaders as NextRequest);
  } catch (error) {
    console.error('Failed to get webhook deliveries:', error);
    return Response.json(
      { error: 'Failed to get webhook deliveries' },
      { status: 500 }
    );
  }
}
