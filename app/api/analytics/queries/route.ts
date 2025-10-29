import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics-service";

import { z } from "zod";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { generateRequestId } from "@/lib/utils";
import { logger } from "@/lib/logger";

const createQuerySchema = z.object({
  name: z.string().min(1, "Query name is required"),
  description: z.string().optional(),
  sql: z.string().min(1, "SQL query is required"),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["string", "number", "date", "boolean"]),
        defaultValue: z.any().optional(),
        required: z.boolean().default(false),
      }),
    )
    .optional(),
  cacheSettings: z
    .object({
      enabled: z.boolean().default(true),
      ttl: z.number().min(60).default(300),
    })
    .optional(),
  schedule: z
    .object({
      enabled: z.boolean().default(false),
      cron: z.string().optional(),
      timezone: z.string().default("UTC"),
    })
    .optional(),
});

// GET /api/analytics/queries - List queries for organization
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "analytics",
      );
    }

    const { searchParams } = new URL(_request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    logger.info("Fetching queries for organization", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
    });

    // Return empty queries array for now
    const queries: any[] = [];

    logger.info("Successfully fetched queries", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      queryCount: queries.length,
    });

    return StandardSuccessResponse.ok({ queries }, requestId);
  } catch (error) {
    logger.apiError("Error fetching queries", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/queries",
    });

    return StandardErrorResponse.internal("Failed to fetch queries", requestId);
  }
}

// POST /api/analytics/queries - Create new query
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "analytics",
      );
    }

    const body = await _request.json();
    const { organizationId, ...queryData } = body;

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        "analytics",
      );
    }

    // Validate request data
    const validatedData = createQuerySchema.parse(queryData);

    logger.info("Creating new query", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      queryName: validatedData.name,
    });

    const result = await AnalyticsService.createQuery(session.user.id, {
      name: validatedData.name,
      description: validatedData.description,
      query: validatedData.sql || "SELECT 1", // Use sql property from schema
      queryType: "sql",
      parameters: validatedData.parameters || [],
      cacheEnabled: validatedData.cacheSettings?.enabled || true,
      cacheTtl: validatedData.cacheSettings?.ttl || 300,
      organizationId,
      isPublic: false,
    });

    logger.info("Successfully created query", "analytics", {
      requestId,
      userId: session.user.id,
      organizationId,
      queryId: result.id,
      queryName: result.name,
    });

    return StandardSuccessResponse.created({ query: result }, requestId);
  } catch (error) {
    logger.apiError("Error creating query", "analytics", error, {
      requestId,
      endpoint: "/api/analytics/queries",
    });

    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Invalid request data",
        "analytics",
        error.errors,
      );
    }

    return StandardErrorResponse.internal("Failed to create query", requestId);
  }
}
