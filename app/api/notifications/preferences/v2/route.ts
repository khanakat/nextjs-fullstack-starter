import { NextRequest } from "next/server";
import { container } from "@/shared/infrastructure/di/container";
import { TYPES } from "@/shared/infrastructure/di/types";
import { PreferencesController } from "@/slices/notifications/presentation/controllers/preferences-controller";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
} from "@/lib/standardized-error-responses";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/notifications/preferences/v2 - Get user notification preferences using DI
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Fetching notification preferences with DI", "notifications", {
      requestId,
    });

    const controller = container.get<PreferencesController>(TYPES.PreferencesController);
    
    // Extract userId from URL params (this would typically come from auth)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return StandardErrorResponse.badRequest(
        "User ID is required",
        "notifications",
        {},
        requestId,
      );
    }

    return await controller.getPreferences(request, { params: { userId } });
  } catch (error) {
    logger.apiError(
      "Error fetching notification preferences with DI",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications/preferences/v2",
      },
    );

    return StandardErrorResponse.internal(
      "Failed to fetch notification preferences",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}

/**
 * PUT /api/notifications/preferences/v2 - Update user notification preferences using DI
 */
export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Updating notification preferences with DI", "notifications", {
      requestId,
    });

    const controller = container.get<PreferencesController>(TYPES.PreferencesController);
    
    // Extract userId from URL params (this would typically come from auth)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return StandardErrorResponse.badRequest(
        "User ID is required",
        "notifications",
        {},
        requestId,
      );
    }

    return await controller.updatePreferences(request, { params: { userId } });
  } catch (error) {
    logger.apiError(
      "Error updating notification preferences with DI",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications/preferences/v2",
      },
    );

    return StandardErrorResponse.internal(
      "Failed to update notification preferences",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
