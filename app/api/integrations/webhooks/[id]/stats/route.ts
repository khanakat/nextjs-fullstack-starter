import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { WebhooksApiController } from '@/slices/integrations/presentation/api/webhooks-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/integrations/webhooks/[id]/stats - Get webhook statistics
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

    const controller = DIContainer.get<WebhooksApiController>(TYPES.WebhooksApiController);
    return controller.getWebhookStats(params.id, request);
  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    return Response.json(
      { error: 'Failed to get webhook stats' },
      { status: 500 }
    );
  }
}
