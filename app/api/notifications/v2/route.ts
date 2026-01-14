import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DIContainer } from "@/shared/infrastructure/di/container";
import { NotificationsController } from "@/slices/notifications/presentation/controllers/notifications-controller";
import { TYPES } from "@/shared/infrastructure/di/types";

/**
 * GET /api/notifications/v2 - Get user notifications using DI
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return controller.getNotifications(request);
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return Response.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/v2 - Create a new notification using DI
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return controller.sendNotification(request);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return Response.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}