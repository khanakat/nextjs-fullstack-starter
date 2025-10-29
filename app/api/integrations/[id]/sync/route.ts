import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { IntegrationService } from "../../../../../api/services/IntegrationService";

import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";

const SyncRequestSchema = z.object({
  connectionId: z.string().optional(),
  syncType: z
    .enum(["full", "incremental", "manual"])
    .optional()
    .default("incremental"),
  options: z.record(z.any()).optional(),
});

/**
 * POST /api/integrations/[id]/sync - Trigger data synchronization
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to sync integration", "API", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const integrationId = params.id;
    if (!integrationId) {
      logger.warn("Missing integration ID parameter", "API", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Integration ID is required",
        requestId,
      );
    }

    let body;
    try {
      body = await _request.json();
    } catch (error) {
      logger.warn("Invalid JSON in request body", "API", {
        requestId,
        userId,
        error,
      });
      return StandardErrorResponse.badRequest(
        "Invalid JSON in request body",
        requestId,
      );
    }

    const validatedData = SyncRequestSchema.parse(body);

    // Get integration with organization check
    const integration = await db.integration.findFirst({
      where: {
        id: integrationId,
        organization: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        connections: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!integration) {
      logger.warn("Integration not found or access denied for sync", "API", {
        requestId,
        userId,
        integrationId,
      });
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    // Determine which connection to sync
    let connectionId = validatedData.connectionId;
    if (!connectionId && integration.connections.length > 0) {
      connectionId = integration.connections[0].id;
    }

    if (!connectionId) {
      logger.warn("No active connection found for integration sync", "API", {
        requestId,
        userId,
        integrationId,
        connectionsCount: integration.connections.length,
      });
      return StandardErrorResponse.badRequest(
        "No active connection found for this integration",
        requestId,
      );
    }

    logger.info("Triggering integration synchronization", "API", {
      requestId,
      userId,
      integrationId,
      connectionId,
      syncType: validatedData.syncType,
      hasOptions: !!validatedData.options,
    });

    // Trigger synchronization
    const integrationService = new IntegrationService(db);
    const syncResult = await integrationService.syncIntegration(
      integration.id,
      {
        integrationId: integration.id,
        syncType:
          validatedData.syncType === "manual" ? "full" : validatedData.syncType,
        options: validatedData.options,
      },
      integration.organizationId,
      userId,
    );

    logger.info("Integration synchronization completed", "API", {
      requestId,
      userId,
      integrationId,
      connectionId,
      success: syncResult.success,
      recordsProcessed: syncResult.recordsProcessed,
      recordsCreated: syncResult.recordsCreated,
      recordsUpdated: syncResult.recordsUpdated,
      recordsDeleted: syncResult.recordsDeleted,
      errorsCount: syncResult.errors?.length || 0,
      duration: syncResult.duration,
    });

    return StandardSuccessResponse.ok(
      {
        success: syncResult.success,
        recordsProcessed: syncResult.recordsProcessed,
        recordsCreated: syncResult.recordsCreated,
        recordsUpdated: syncResult.recordsUpdated,
        recordsDeleted: syncResult.recordsDeleted,
        errors: syncResult.errors,
        duration: syncResult.duration,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in sync integration request", "API", {
        requestId,
        error: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to sync integration", "API", { requestId, error });
    return StandardErrorResponse.internal(
      "Failed to sync integration",
      undefined,
      requestId,
    );
  }
}

/**
 * GET /api/integrations/[id]/sync - Get sync status and history
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to get sync status", "API", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const integrationId = params.id;
    if (!integrationId) {
      logger.warn("Missing integration ID parameter", "API", {
        requestId,
        userId,
      });
      return StandardErrorResponse.badRequest(
        "Integration ID is required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const connectionId = searchParams.get("connectionId");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get integration with organization check
    const integration = await db.integration.findFirst({
      where: {
        id: integrationId,
        organization: {
          members: {
            some: { userId },
          },
        },
      },
      include: {
        connections: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!integration) {
      logger.warn(
        "Integration not found or access denied for sync status",
        "API",
        {
          requestId,
          userId,
          integrationId,
        },
      );
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    logger.info("Retrieving integration sync status and history", "API", {
      requestId,
      userId,
      integrationId,
      connectionId,
      limit,
    });

    // Get sync history from integration logs
    const syncLogs = await db.integrationLog.findMany({
      where: {
        integrationId: integration.id,
        action: { in: ["sync_started", "sync_completed", "sync_failed"] },
        ...(connectionId && {
          requestData: {
            contains: connectionId,
          },
        }),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Get current sync status
    const currentSync = await db.integrationLog.findFirst({
      where: {
        integrationId: integration.id,
        action: "sync_started",
        status: "pending",
      },
      orderBy: { timestamp: "desc" },
    });

    // Parse sync history
    const syncHistory = syncLogs.map((log) => {
      let request = {};
      let response = {};

      try {
        request = log.requestData ? JSON.parse(log.requestData as string) : {};
      } catch (e) {
        // Ignore parse errors
      }

      try {
        response = log.responseData
          ? JSON.parse(log.responseData as string)
          : {};
      } catch (e) {
        // Ignore parse errors
      }

      return {
        id: log.id,
        action: log.action,
        status: log.status,
        timestamp: log.timestamp,
        request,
        response,
      };
    });

    // Get connection sync status
    const connections = integration.connections.map((connection) => ({
      id: connection.id,
      status: connection.status,
      connectionType: connection.connectionType,
      lastConnected: connection.lastConnected,
      createdAt: connection.createdAt,
    }));

    logger.info("Integration sync status retrieved successfully", "API", {
      requestId,
      userId,
      integrationId,
      syncHistoryCount: syncHistory.length,
      connectionsCount: connections.length,
      hasCurrentSync: !!currentSync,
    });

    return StandardSuccessResponse.ok(
      {
        integrationId: integration.id,
        integrationStatus: integration.status,
        currentSync: currentSync
          ? {
              id: currentSync.id,
              startedAt: currentSync.timestamp,
              status: currentSync.status,
            }
          : null,
        connections,
        syncHistory,
        lastSync:
          integration.connections.length > 0
            ? Math.max(
                ...integration.connections.map(
                  (c) => c.lastConnected?.getTime() || 0,
                ),
              )
            : null,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to get integration sync status", "API", {
      requestId,
      error,
    });
    return StandardErrorResponse.internal(
      "Failed to get integration sync status",
      undefined,
      requestId,
    );
  }
}
