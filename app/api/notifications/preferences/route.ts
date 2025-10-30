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

// Demo preferences for when user is not authenticated
const DEMO_PREFERENCES = {
  userId: "demo-user",
  channels: {
    inApp: true,
    email: true,
    push: false,
    sms: false,
  },
  categories: {
    security: true,
    updates: true,
    marketing: false,
    system: true,
    billing: true,
  },
  frequency: "immediate" as const,
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "08:00",
    timezone: "UTC",
  },
};

// Helper function to safely get user ID from auth
async function safeGetUserId(): Promise<string | null> {
  try {
    const { userId } = auth();
    return userId;
  } catch (error) {
    // Auth failed (likely Clerk not configured), return null for demo mode
    logger.info("Auth failed, using demo mode", "notifications", { error: error instanceof Error ? error.message : error });
    return null;
  }
}

/**
 * GET /api/notifications/preferences - Get user notification preferences
 */
export async function GET() {
  const requestId = generateRequestId();

  try {
    const userId = await safeGetUserId();

    // Demo mode support - return demo preferences when no user is authenticated
    if (!userId) {
      logger.info("Returning demo notification preferences", "notifications", {
        requestId,
        userId: "demo-user",
      });

      return StandardSuccessResponse.create({
        preferences: DEMO_PREFERENCES,
        requestId,
      });
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
      "Error fetching notification preferences",
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
 * PATCH /api/notifications/preferences - Update user notification preferences
 */
export async function PATCH(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const userId = await safeGetUserId();

    // Demo mode - don't update preferences, just return success
    if (!userId) {
      const body = await _request.json();
      
      logger.info("Demo mode: preference update simulated", "notifications", {
        requestId,
        userId: "demo-user",
        updates: Object.keys(body),
      });

      // Return updated demo preferences
      const updatedPreferences = {
        ...DEMO_PREFERENCES,
        ...body,
        userId: "demo-user",
      };

      return StandardSuccessResponse.create({
        preferences: updatedPreferences,
        message: "Preferences updated successfully (demo mode)",
        requestId,
      });
    }

    const body = await _request.json();

    logger.info("Updating user notification preferences", "notifications", {
      requestId,
      userId,
      updates: Object.keys(body),
    });

    // Validate the request body structure
    const validFields = [
      "channels",
      "categories", 
      "frequency",
      "quietHours",
    ];

    const hasValidFields = Object.keys(body).some(key => validFields.includes(key));
    
    if (!hasValidFields) {
      return StandardErrorResponse.badRequest(
        "No valid preference fields provided",
        "notifications",
        { validFields, providedFields: Object.keys(body) },
        requestId,
      );
    }

    const updatedPreferences = await notificationStore.updateUserPreferences(
      userId,
      body,
    );

    return StandardSuccessResponse.create({
      preferences: updatedPreferences,
      requestId,
    });
  } catch (error) {
    logger.apiError(
      "Error updating notification preferences",
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
