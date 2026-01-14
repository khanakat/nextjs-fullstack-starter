import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { NotificationsController } from '@/slices/notifications/presentation/controllers/notifications-controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * GET /api/notifications/[id] - Get single notification
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

    // Add user ID to request headers
    const headers = new Headers(request.headers);
    headers.set('x-user-id', userId);

    const requestWithUserId = new Request(request.url, {
      ...request,
      headers,
    });

    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    // Use getNotifications with ID filter for now (controller needs getNotification method)
    return controller.getNotifications(requestWithUserId as NextRequest);
  } catch (error) {
    console.error('Failed to get notification:', error);
    return Response.json(
      { error: 'Failed to get notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/[id] - Mark notification as read
 */
export async function PATCH(
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

/**
 * DELETE /api/notifications/[id] - Delete notification
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

    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return controller.deleteNotification(requestWithUserId as NextRequest, { params });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return Response.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
