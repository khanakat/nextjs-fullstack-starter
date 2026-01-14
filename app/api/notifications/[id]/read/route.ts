import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { NotificationsController } from '@/slices/notifications/presentation/controllers/notifications-controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * PUT /api/notifications/[id]/read - Mark notification as read (alias for PATCH)
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

    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return controller.markAsRead(requestWithUserId as NextRequest, { params });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return Response.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}