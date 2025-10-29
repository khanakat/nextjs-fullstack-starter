import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { notificationStore } from "@/lib/notifications";
import { generateRequestId } from "@/lib/utils";

/**
 * GET /api/notifications/preferences - Get user notification preferences
 */
export async function GET() {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access notification preferences",
        requestId,
      );
    }

    logger.info("Fetching user notification preferences", "notifications", {
      requestId,
      userId,
    });

    const preferences = await notificationStore.getUserPreferences(userId);

    return StandardSuccessResponse.create({
      preferences,
      requestId,
    });
  } catch (error) {
    logger.apiError(
      "Error processing notification preferences request",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications/preferences",
      },
    );

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process notification preferences request",
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
 * PATCH /api/notifications/preferences - Update user notification preferences
 */
export async function PATCH(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();

    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to update notification preferences",
        requestId,
      );
    }

    const updates = await _request.json();

    // Validate the updates structure
    const allowedUpdates = [
      "channels",
      "categories",
      "frequency",
      "quietHours",
    ];

    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return StandardErrorResponse.badRequest(
        "No valid updates provided",
        "notifications",
        { allowedUpdates, providedKeys: Object.keys(updates) },
        requestId,
      );
    }

    logger.info("Updating user notification preferences", "notifications", {
      requestId,
      userId,
      updateKeys: Object.keys(filteredUpdates),
    });

    const updatedPreferences = await notificationStore.updateUserPreferences(
      userId,
      filteredUpdates,
    );

    return StandardSuccessResponse.updated({
      preferences: updatedPreferences,
      requestId,
    });
  } catch (error) {
    logger.apiError(
      "Error processing notification preferences request",
      "notification",
      error,
      {
        requestId,
        endpoint: "/api/notifications/preferences",
      },
    );

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process notification preferences request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
