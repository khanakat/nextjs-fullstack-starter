import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { z } from "zod";

const offlineActionSchema = z.object({
  id: z.string(),
  action: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  retryCount: z.number().default(0),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const queueActionSchema = z.object({
  actions: z.array(offlineActionSchema),
  deviceId: z.string().optional(),
});

const updateActionSchema = z.object({
  id: z.string(),
  retryCount: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  synced: z.boolean().optional(),
});

// POST - Queue offline actions
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing offline actions queue request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized offline actions queue attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const { actions, deviceId } = queueActionSchema.parse(body);

    logger.info("Offline actions queue parameters", "mobile", {
      requestId,
      userId,
      actionsCount: actions.length,
      deviceId,
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        organizationMemberships: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn("User not found for offline actions", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    const queuedActions: string[] = [];

    // Queue each action
    for (const action of actions) {
      try {
        await prisma.offlineAction.upsert({
          where: {
            id: action.id,
          },
          update: {
            action: action.action,
            data: JSON.stringify(action.data),
            timestamp: new Date(action.timestamp),
            retryCount: action.retryCount,
            priority: action.priority,
            updatedAt: new Date(),
          },
          create: {
            id: action.id,
            userId: user.id,
            action: action.action,
            data: JSON.stringify(action.data),
            timestamp: new Date(action.timestamp),
            retryCount: action.retryCount,
            priority: action.priority,
            synced: false,
            deviceId,
          },
        });

        queuedActions.push(action.id);

        logger.info("Offline action queued successfully", "mobile", {
          requestId,
          actionId: action.id,
          actionType: action.action,
          priority: action.priority,
          userId: user.id,
        });
      } catch (error) {
        logger.error("Failed to queue offline action", "mobile", {
          requestId,
          actionId: action.id,
          actionType: action.action,
          error: error instanceof Error ? error.message : "Unknown error",
          userId: user.id,
        });
      }
    }

    // Update device info if provided
    if (deviceId) {
      try {
        await prisma.deviceInfo.updateMany({
          where: {
            userId: user.id,
            deviceId,
          },
          data: {
            lastSeen: new Date(),
          },
        });

        logger.info("Device info updated for offline actions", "mobile", {
          requestId,
          deviceId,
          queuedCount: queuedActions.length,
          userId: user.id,
        });
      } catch (error) {
        logger.warn("Failed to update device info", "mobile", {
          requestId,
          deviceId,
          error: error instanceof Error ? error.message : "Unknown error",
          userId: user.id,
        });
      }
    }

    logger.info("Offline actions queued successfully", "mobile", {
      requestId,
      userId: user.id,
      totalActions: actions.length,
      queuedActions: queuedActions.length,
    });

    return StandardSuccessResponse.created(
      {
        queuedActions,
        totalQueued: queuedActions.length,
        timestamp: new Date().toISOString(),
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid offline actions data", "mobile", {
        requestId,
        validationErrors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error processing offline actions queue", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/offline",
    });

    return StandardErrorResponse.internal(
      "Failed to queue offline actions",
      requestId,
    );
  }
}

// GET - Get queued offline actions
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing offline actions retrieval request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized offline actions retrieval attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId");
    const priority = searchParams.get("priority") as
      | "low"
      | "medium"
      | "high"
      | null;
    const synced = searchParams.get("synced");
    const limit = parseInt(searchParams.get("limit") || "50");

    logger.info("Offline actions retrieval parameters", "mobile", {
      requestId,
      userId,
      deviceId,
      priority,
      synced,
      limit,
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        organizationMemberships: {
          select: { organizationId: true },
        },
      },
    });

    if (!user) {
      logger.warn("User not found for offline actions retrieval", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    // Build query filters
    const where: any = {
      userId: user.id,
    };

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (synced !== null) {
      where.synced = synced === "true";
    }

    // Get offline actions
    const actions = await prisma.offlineAction.findMany({
      where,
      orderBy: [{ priority: "desc" }, { timestamp: "asc" }],
      take: Math.min(limit, 100), // Cap at 100
      select: {
        id: true,
        action: true,
        data: true,
        timestamp: true,
        retryCount: true,
        priority: true,
        synced: true,
        syncedAt: true,
        lastError: true,
        deviceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Parse data field for each action
    const parsedActions = actions.map((action) => ({
      ...action,
      data: JSON.parse(action.data),
    }));

    logger.info("Offline actions retrieved successfully", "mobile", {
      requestId,
      userId: user.id,
      actionsCount: parsedActions.length,
      filters: { deviceId, priority, synced },
    });

    return StandardSuccessResponse.ok(
      {
        actions: parsedActions,
        total: parsedActions.length,
        timestamp: new Date().toISOString(),
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error retrieving offline actions", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/offline",
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve offline actions",
      requestId,
    );
  }
}

// PUT - Update offline action status
export async function PUT(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing offline action update request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized offline action update attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const { id, retryCount, priority, synced } = updateActionSchema.parse(body);

    logger.info("Offline action update parameters", "mobile", {
      requestId,
      userId,
      actionId: id,
      retryCount,
      priority,
      synced,
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.warn("User not found for offline action update", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    // Check if action exists and belongs to user
    const existingAction = await prisma.offlineAction.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingAction) {
      logger.warn("Offline action not found for update", "mobile", {
        requestId,
        actionId: id,
        userId: user.id,
      });
      return StandardErrorResponse.notFound(
        "Offline action not found",
        requestId,
      );
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (retryCount !== undefined) {
      updateData.retryCount = retryCount;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (synced !== undefined) {
      updateData.synced = synced;
      if (synced) {
        updateData.syncedAt = new Date();
      }
    }

    // Update the action
    const updatedAction = await prisma.offlineAction.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        action: true,
        data: true,
        timestamp: true,
        retryCount: true,
        priority: true,
        synced: true,
        syncedAt: true,
        lastError: true,
        deviceId: true,
        updatedAt: true,
      },
    });

    logger.info("Offline action updated successfully", "mobile", {
      requestId,
      actionId: id,
      userId: user.id,
      updates: updateData,
    });

    return StandardSuccessResponse.ok(
      {
        action: {
          ...updatedAction,
          data: JSON.parse(updatedAction.data),
        },
        timestamp: new Date().toISOString(),
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid offline action update data", "mobile", {
        requestId,
        validationErrors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error updating offline action", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/offline",
    });

    return StandardErrorResponse.internal(
      "Failed to update offline action",
      requestId,
    );
  }
}

// DELETE - Delete offline actions
export async function DELETE(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing offline actions deletion request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized offline actions deletion attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const actionId = searchParams.get("id");
    const deviceId = searchParams.get("deviceId");
    const synced = searchParams.get("synced");

    logger.info("Offline actions deletion parameters", "mobile", {
      requestId,
      userId,
      actionId,
      deviceId,
      synced,
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.warn("User not found for offline actions deletion", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    let deletedCount = 0;

    if (actionId) {
      // Delete specific action
      const result = await prisma.offlineAction.deleteMany({
        where: {
          id: actionId,
          userId: user.id,
        },
      });
      deletedCount = result.count;

      if (deletedCount === 0) {
        logger.warn("Offline action not found for deletion", "mobile", {
          requestId,
          actionId,
          userId: user.id,
        });
        return StandardErrorResponse.notFound(
          "Offline action not found",
          requestId,
        );
      }
    } else {
      // Delete multiple actions based on filters
      const where: any = {
        userId: user.id,
      };

      if (deviceId) {
        where.deviceId = deviceId;
      }

      if (synced !== null) {
        where.synced = synced === "true";
      }

      const result = await prisma.offlineAction.deleteMany({
        where,
      });
      deletedCount = result.count;
    }

    logger.info("Offline actions deleted successfully", "mobile", {
      requestId,
      userId: user.id,
      deletedCount,
      filters: { actionId, deviceId, synced },
    });

    return StandardSuccessResponse.ok(
      {
        deletedCount,
        timestamp: new Date().toISOString(),
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error deleting offline actions", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/offline",
    });

    return StandardErrorResponse.internal(
      "Failed to delete offline actions",
      requestId,
    );
  }
}
