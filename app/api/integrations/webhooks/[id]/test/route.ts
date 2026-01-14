import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WebhooksApiController } from '@/slices/integrations/presentation/api/webhooks-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * POST /api/integrations/webhooks/[id]/test - Test webhook endpoint
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

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.testWebhook(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to test webhook:', error);
    return Response.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/webhooks/[id]/test - Get webhook test history
 * TODO: Implement test history query and handler
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

    // TODO: Implement GetWebhookTestHistoryQuery and handler
    // For now, return empty response
    return Response.json({
      webhookId: params.id,
      testHistory: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    });
  } catch (error) {
    console.error('Failed to get webhook test history:', error);
    return Response.json(
      { error: 'Failed to get webhook test history' },
      { status: 500 }
    );
  }
}
