import { NextRequest } from 'next/server';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { NotificationsController } from '@/slices/notifications/presentation/controllers/notifications-controller';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Notifications API Routes
 * Handles HTTP requests for notification management using clean architecture
 */

// GET /api/notifications - Get notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return await controller.getNotifications(request);
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return await controller.createNotification(request);
  } catch (error) {
    console.error('Error in POST /api/notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
