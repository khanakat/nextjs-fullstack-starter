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

const syncActionSchema = z.object({
  id: z.string(),
  action: z.string(),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  retryCount: z.number().default(0),
});

const syncRequestSchema = z.object({
  actions: z.array(syncActionSchema),
  lastSyncTimestamp: z.string().datetime().optional(),
  deviceId: z.string().optional(),
});

// POST - Sync offline actions with server
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing mobile sync request", "mobile", { requestId });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized sync attempt", "mobile", { requestId });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const { actions, lastSyncTimestamp, deviceId } =
      syncRequestSchema.parse(body);

    logger.info("Sync request parameters", "mobile", {
      requestId,
      userId,
      actionsCount: actions.length,
      deviceId,
      hasLastSyncTimestamp: !!lastSyncTimestamp,
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
      logger.warn("User not found for sync", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    const organizationId =
      user.organizationMemberships[0]?.organizationId || null;
    const syncedActions: string[] = [];
    const failedActions: Array<{ id: string; error: string }> = [];

    // Process each offline action
    for (const action of actions) {
      try {
        await processOfflineAction(action, user.id, organizationId);
        syncedActions.push(action.id);

        logger.info("Offline action processed successfully", "mobile", {
          requestId,
          actionId: action.id,
          actionType: action.action,
          userId: user.id,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        failedActions.push({
          id: action.id,
          error: errorMessage,
        });

        logger.warn("Failed to process offline action", "mobile", {
          requestId,
          actionId: action.id,
          actionType: action.action,
          error: errorMessage,
          userId: user.id,
        });
      }
    }

    // Get server updates if lastSyncTimestamp provided
    const serverUpdates: Array<Record<string, any>> = [];
    if (lastSyncTimestamp) {
      const updates = await getServerUpdates(
        user.id,
        organizationId,
        new Date(lastSyncTimestamp),
      );
      serverUpdates.push(...updates);
    }

    // Update device last seen if deviceId provided
    if (deviceId) {
      try {
        await prisma.deviceInfo.updateMany({
          where: {
            userId: user.id,
            deviceId: deviceId,
          },
          data: {
            lastSeen: new Date(),
          },
        });

        logger.info("Device last seen updated", "mobile", {
          requestId,
          deviceId,
          userId: user.id,
        });
      } catch (error) {
        logger.warn("Failed to update device last seen", "mobile", {
          requestId,
          deviceId,
          error: error instanceof Error ? error.message : "Unknown error",
          userId: user.id,
        });
      }
    }

    const response = {
      success: true,
      syncedActions,
      failedActions,
      serverUpdates,
      nextSyncTimestamp: new Date().toISOString(),
    };

    logger.info("Mobile sync completed successfully", "mobile", {
      requestId,
      userId: user.id,
      syncedCount: syncedActions.length,
      failedCount: failedActions.length,
      serverUpdatesCount: serverUpdates.length,
    });

    return StandardSuccessResponse.ok(response, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid sync request data", "mobile", {
        requestId,
        validationErrors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error processing mobile sync", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/sync",
    });

    return StandardErrorResponse.internal(
      "Failed to process sync request",
      requestId,
    );
  }
}

// GET - Get pending server updates
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing mobile sync updates request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized sync updates request", "mobile", { requestId });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const lastSyncTimestamp = searchParams.get("lastSync");
    const deviceId = searchParams.get("deviceId");

    logger.info("Sync updates request parameters", "mobile", {
      requestId,
      userId,
      hasLastSync: !!lastSyncTimestamp,
      deviceId,
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
      logger.warn("User not found for sync updates", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    const serverUpdates: Array<Record<string, any>> = [];

    if (lastSyncTimestamp) {
      const updates = await getServerUpdates(
        user.id,
        user.organizationMemberships[0]?.organizationId,
        new Date(lastSyncTimestamp),
      );
      serverUpdates.push(...updates);
    }

    // Update device last seen
    if (deviceId) {
      try {
        await prisma.deviceInfo.updateMany({
          where: {
            userId: user.id,
            deviceId: deviceId,
          },
          data: {
            lastSeen: new Date(),
          },
        });

        logger.info("Device last seen updated during sync updates", "mobile", {
          requestId,
          deviceId,
          userId: user.id,
        });
      } catch (error) {
        logger.warn(
          "Failed to update device last seen during sync updates",
          "mobile",
          {
            requestId,
            deviceId,
            error: error instanceof Error ? error.message : "Unknown error",
            userId: user.id,
          },
        );
      }
    }

    logger.info("Mobile sync updates retrieved successfully", "mobile", {
      requestId,
      userId: user.id,
      updatesCount: serverUpdates.length,
    });

    return StandardSuccessResponse.ok(
      {
        updates: serverUpdates,
        timestamp: new Date().toISOString(),
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error retrieving mobile sync updates", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/sync",
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve sync updates",
      requestId,
    );
  }
}

async function processOfflineAction(
  action: z.infer<typeof syncActionSchema>,
  userId: string,
  organizationId: string | null,
) {
  // This function would contain the logic to process different types of offline actions
  // For example: creating workflows, updating user profiles, etc.

  switch (action.action) {
    case "create_workflow":
      // Process workflow creation
      await prisma.workflow.create({
        data: {
          name: action.data.name || "Untitled Workflow",
          description: action.data.description,
          definition: action.data.definition || "{}",
          ...action.data,
          createdBy: userId,
          organizationId,
          createdAt: new Date(action.timestamp),
        },
      });
      break;

    case "update_workflow":
      // Process workflow update
      await prisma.workflow.update({
        where: { id: action.data.id },
        data: {
          ...action.data,
          updatedAt: new Date(action.timestamp),
        },
      });
      break;

    case "delete_workflow":
      // Process workflow deletion
      await prisma.workflow.delete({
        where: { id: action.data.id },
      });
      break;

    case "create_workflow_task":
      // Process workflow task creation
      await prisma.workflowTask.create({
        data: {
          name: action.data.name || "New Task",
          instanceId: action.data.instanceId,
          stepId: action.data.stepId,
          ...action.data,
          createdAt: new Date(action.timestamp),
        },
      });
      break;

    case "update_workflow_task":
      // Process workflow task update
      await prisma.workflowTask.update({
        where: { id: action.data.id },
        data: {
          ...action.data,
        },
      });
      break;

    case "delete_workflow_task":
      // Process workflow task deletion
      await prisma.workflowTask.delete({
        where: { id: action.data.id },
      });
      break;

    default:
      throw new Error(`Unknown action type: ${action.action}`);
  }
}

async function getServerUpdates(
  userId: string,
  organizationId: string | null,
  lastSyncTimestamp: Date,
): Promise<Array<Record<string, any>>> {
  const updates: Array<Record<string, any>> = [];

  // Get updated workflows
  const workflows = await prisma.workflow.findMany({
    where: {
      OR: [{ createdBy: userId }, { organizationId }],
      updatedAt: {
        gt: lastSyncTimestamp,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updatedAt: true,
    },
  });

  workflows.forEach((workflow) => {
    updates.push({
      type: "workflow_update",
      data: workflow,
      timestamp: workflow.updatedAt.toISOString(),
    });
  });

  // Get updated workflow tasks
  const workflowTasks = await prisma.workflowTask.findMany({
    where: {
      instance: {
        workflow: {
          OR: [{ createdBy: userId }, { organizationId }],
        },
      },
      createdAt: {
        gt: lastSyncTimestamp,
      },
    },
    include: {
      instance: {
        select: { id: true },
      },
      step: {
        select: { name: true },
      },
    },
  });

  workflowTasks.forEach((task) => {
    updates.push({
      type: "workflow_task_update",
      data: task,
      timestamp: task.createdAt.toISOString(),
    });
  });

  // Get new notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      createdAt: {
        gt: lastSyncTimestamp,
      },
    },
  });

  notifications.forEach((notification) => {
    updates.push({
      type: "notification",
      data: notification,
      timestamp: notification.createdAt.toISOString(),
    });
  });

  return updates;
}
