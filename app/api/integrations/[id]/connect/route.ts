import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { OAuthService } from "../../../../../api/services/integrations/OAuthService";
import { CredentialService } from "../../../../../api/services/integrations/CredentialService";
import {
  IntegrationProvider,
  ConnectionType,
} from "../../../../../shared/types/integration";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";

const ConnectRequestSchema = z.object({
  connectionType: z.enum([
    "oauth",
    "api_key",
    "basic_auth",
    "bearer_token",
    "custom",
  ]),
  credentials: z.record(z.any()).optional(),
  config: z.record(z.any()).optional(),
  redirectUrl: z.string().url().optional(),
});

/**
 * POST /api/integrations/[id]/connect - Initiate connection for integration
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt to connect integration", "API", {
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

    const validatedData = ConnectRequestSchema.parse(body);

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
    });

    if (!integration) {
      logger.warn(
        "Integration not found or access denied for connection",
        "API",
        {
          requestId,
          userId,
          integrationId,
        },
      );
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    const provider = integration.provider as IntegrationProvider;
    const config = {
      ...JSON.parse(integration.config as string),
      ...validatedData.config,
    };

    logger.info("Processing integration connection request", "API", {
      requestId,
      userId,
      integrationId,
      connectionType: validatedData.connectionType,
      provider,
    });

    // Handle different connection types
    switch (validatedData.connectionType) {
      case "oauth":
        // Generate OAuth authorization URL
        const authResult = await OAuthService.getAuthorizationUrl(
          provider,
          config,
          integration.organizationId,
          userId,
        );

        logger.info("OAuth authorization URL generated successfully", "API", {
          requestId,
          userId,
          integrationId,
          state: authResult.state,
        });

        return StandardSuccessResponse.ok(
          {
            type: "oauth",
            authorizationUrl: authResult.authUrl,
            state: authResult.state,
            integrationId: authResult.integrationId,
          },
          requestId,
        );

      case "api_key":
      case "basic_auth":
      case "bearer_token":
      case "custom":
        // Store credentials directly
        if (!validatedData.credentials) {
          logger.warn("Missing credentials for connection type", "API", {
            requestId,
            userId,
            integrationId,
            connectionType: validatedData.connectionType,
          });
          return StandardErrorResponse.badRequest(
            "Credentials required for this connection type",
            requestId,
          );
        }

        const credentialResult = await CredentialService.storeCredentials(
          integration.id,
          validatedData.credentials,
          validatedData.connectionType as ConnectionType,
          integration.organizationId,
        );

        if (!credentialResult.success) {
          logger.error("Failed to store credentials", "API", {
            requestId,
            userId,
            integrationId,
            error: credentialResult.error,
          });
          return StandardErrorResponse.badRequest(
            credentialResult.error || "Failed to store credentials",
            requestId,
          );
        }

        logger.info("Credentials stored successfully", "API", {
          requestId,
          userId,
          integrationId,
          connectionId: credentialResult.connectionId,
          connectionType: validatedData.connectionType,
        });

        return StandardSuccessResponse.ok(
          {
            type: "credentials",
            success: true,
            connectionId: credentialResult.connectionId,
          },
          requestId,
        );

      default:
        logger.warn("Unsupported connection type", "API", {
          requestId,
          userId,
          integrationId,
          connectionType: validatedData.connectionType,
        });
        return StandardErrorResponse.badRequest(
          "Unsupported connection type",
          requestId,
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in connect integration request", "API", {
        requestId,
        error: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Failed to connect integration", "API", { requestId, error });
    return StandardErrorResponse.internal(
      "Failed to connect integration",
      undefined,
      requestId,
    );
  }
}

/**
 * GET /api/integrations/[id]/connect - Get connection status
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    const { userId } = auth();
    if (!userId) {
      logger.warn(
        "Unauthorized access attempt to get connection status",
        "API",
        { requestId },
      );
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

    // Get integration with connections and organization check
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
        "Integration not found or access denied for connection status",
        "API",
        {
          requestId,
          userId,
          integrationId,
        },
      );
      return StandardErrorResponse.notFound("Integration not found", requestId);
    }

    const connections = integration.connections.map((connection) => ({
      id: connection.id,
      status: connection.status,
      connectionType: connection.connectionType,
      lastConnected: connection.lastConnected,
      createdAt: connection.createdAt,
    }));

    logger.info("Connection status retrieved successfully", "API", {
      requestId,
      userId,
      integrationId,
      connectionsCount: connections.length,
      hasActiveConnection: connections.some((c) => c.status === "active"),
    });

    return StandardSuccessResponse.ok(
      {
        integrationId: integration.id,
        status: integration.status,
        connections,
        hasActiveConnection: connections.some((c) => c.status === "active"),
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to get connection status", "API", {
      requestId,
      error,
    });
    return StandardErrorResponse.internal(
      "Failed to get connection status",
      undefined,
      requestId,
    );
  }
}
