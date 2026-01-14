import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { IntegrationTemplatesApiController } from '@/slices/integrations/presentation/api/integration-templates-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/integrations/templates - List integration templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const controller = DIContainer.get<IntegrationTemplatesApiController>(TYPES.IntegrationTemplatesApiController);
    return controller.getTemplates(request);
  } catch (error) {
    console.error('Failed to list templates:', error);
    return Response.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/templates - Create integration from template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user ID to request headers for handler to use
    const headers = new Headers(request.headers);
    headers.set('x-user-id', session.user.id);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<IntegrationTemplatesApiController>(TYPES.IntegrationTemplatesApiController);
    return controller.createFromTemplate(requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to process template request:', error);
    return Response.json(
      { error: 'Failed to process template request' },
      { status: 500 }
    );
  }
}
