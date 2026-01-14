import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DIContainer } from "@/shared/infrastructure/di/container";
import { NotificationsController } from "@/slices/notifications/presentation/controllers/notifications-controller";
import { TYPES } from "@/shared/infrastructure/di/types";

/**
 * PUT /api/notifications/bulk/read - Mark multiple notifications as read
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const controller = DIContainer.get<NotificationsController>(TYPES.NotificationsController);
    return controller.bulkMarkAsRead(request);
  } catch (error) {
    console.error('Failed to bulk mark notifications as read:', error);
    return Response.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}