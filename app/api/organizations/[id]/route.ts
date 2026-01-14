import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { OrganizationsApiController } from '@/slices/organizations/presentation/api/organizations-api.controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/organizations/[id]
 * Get organization by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.id);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<OrganizationsApiController>(TYPES.OrganizationsController);
    return controller.getOrganization(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to get organization:', error);
    return Response.json(
      { error: 'Failed to get organization' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * Update organization
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.id);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<OrganizationsApiController>(TYPES.OrganizationsController);
    return controller.updateOrganization(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to update organization:', error);
    return Response.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.id);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<OrganizationsApiController>(TYPES.OrganizationsController);
    return controller.deleteOrganization(params.id, requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to delete organization:', error);
    return Response.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
