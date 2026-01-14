import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { SecurityApiController } from '@/slices/security/presentation/api/security-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/security/api-keys - List API keys
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const controller = DIContainer.get<SecurityApiController>(TYPES.SecurityApiController);
    return controller.listApiKeys(request);
  } catch (error) {
    console.error('Failed to list API keys:', error);
    return Response.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/api-keys - Create API key
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
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

    const controller = DIContainer.get<SecurityApiController>(TYPES.SecurityApiController);
    return controller.createApiKey(requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to create API key:', error);
    return Response.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
