import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DIContainer } from "@/shared/infrastructure/di/container";
import { PreferencesController } from "@/slices/notifications/presentation/controllers/preferences-controller";
import { TYPES } from "@/shared/infrastructure/di/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/notifications/preferences/v2 - Get user notification preferences using DI
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const controller = DIContainer.get<PreferencesController>(TYPES.PreferencesController);
    return controller.getPreferences(request, { params: { userId } });
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return Response.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences/v2 - Update user notification preferences using DI
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = auth();
    const userId = authResult.userId;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const controller = DIContainer.get<PreferencesController>(TYPES.PreferencesController);
    return controller.updatePreferences(request, { params: { userId } });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return Response.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
