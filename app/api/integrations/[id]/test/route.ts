import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { ConnectionTestService } from "../../../../../api/services/integrations/ConnectionTestService";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";

const TestRequestSchema = z.object({
  connectionId: z.string().optional(),
  testCapabilities: z.boolean().optional(),
});

/**
 * POST /api/integrations/[id]/test - Test integration connection
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to test integration", "API", {
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

    const validatedData = TestRequestSchema.parse(body);

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
      logger.warn("Integration not found or access denied for test", "API", {
        requestId,
        userId,
        integrationId,
      });
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    // Determine which connection to test
    let connectionId = validatedData.connectionId;
    if (!connectionId && integration.connections.length > 0) {
      connectionId = integration.connections[0].id;
    }

    if (!connectionId) {
      logger.warn("No active connection found for integration test", "API", {
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

    logger.info("Testing integration connection", "API", {
      requestId,
      userId,
      integrationId,
      connectionId,
      testCapabilities: validatedData.testCapabilities,
    });

    // Test the connection
    const testResult = await ConnectionTestService.testStoredConnection(
      connectionId,
      integration.organizationId,
    );

    // If capabilities test is requested, run additional tests
    let capabilityResult = null;
    if (validatedData.testCapabilities && testResult.success) {
      capabilityResult = await ConnectionTestService.testConnectionCapabilities(
        connectionId,
        integration.organizationId,
      );
    }

    logger.info("Integration connection test completed", "API", {
      requestId,
      userId,
      integrationId,
      connectionId,
      testSuccess: testResult.success,
      capabilityTestRun: !!capabilityResult,
    });

    return StandardSuccessResponse.ok(
      {
        connectionTest: testResult,
        capabilityTest: capabilityResult,
        connectionId,
        integrationId: integration.id,
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in test integration request", "API", {
        requestId,
        error: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to test integration", "API", { requestId, error });
    return StandardErrorResponse.internal(
      "Failed to test integration",
      undefined,
      requestId,
    );
  }
}

/**
 * GET /api/integrations/[id]/test - Get test history
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to get test history", "API", {
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
    const limit = parseInt(searchParams.get("limit") || "50");

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
        connections: true,
      },
    });

    if (!integration) {
      logger.warn(
        "Integration not found or access denied for test history",
        "API",
        {
          requestId,
          userId,
          integrationId,
        },
      );
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    logger.info("Retrieving integration test history", "API", {
      requestId,
      userId,
      integrationId,
      connectionId,
      limit,
    });

    // Get test history
    let testHistory = [];
    if (connectionId) {
      // Get history for specific connection
      testHistory = await ConnectionTestService.getTestHistory(
        connectionId,
        integration.organizationId,
        limit,
      );
    } else {
      // Get history for all connections of this integration
      for (const connection of integration.connections) {
        const history = await ConnectionTestService.getTestHistory(
          connection.id,
          integration.organizationId,
          Math.ceil(limit / integration.connections.length),
        );
        testHistory.push(
          ...history.map((h) => ({ ...h, connectionId: connection.id })),
        );
      }

      // Sort by timestamp and limit
      testHistory = testHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    }

    logger.info("Integration test history retrieved successfully", "API", {
      requestId,
      userId,
      integrationId,
      historyCount: testHistory.length,
      connectionsCount: integration.connections.length,
    });

    return StandardSuccessResponse.ok(
      {
        integrationId: integration.id,
        testHistory,
        connections: integration.connections.map((c) => ({
          id: c.id,
          status: c.status,
          connectionType: c.connectionType,
          lastConnected: c.lastConnected,
        })),
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to get integration test history", "API", {
      requestId,
      error,
    });
    return StandardErrorResponse.internal(
      "Failed to get integration test history",
      undefined,
      requestId,
    );
  }
}
