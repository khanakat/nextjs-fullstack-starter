import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DIContainer } from "@/shared/infrastructure/di/container";
import { NotificationsController } from "@/slices/notifications/presentation/controllers/notifications-controller";
import { TYPES } from "@/shared/infrastructure/di/types";

/**
 * POST /api/notifications/bulk - Create multiple notifications
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
    console.error('Failed to create bulk notifications:', error);
    return Response.json(
      { error: 'Failed to create bulk notifications' },
      { status: 500 }
    );
  }
}