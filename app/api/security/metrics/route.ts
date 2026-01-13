import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { SecurityService } from "@/lib/services/security-service";
import { MembershipService } from "@/lib/services/organization-service";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const organizationId = searchParams.get("organizationId");
    const range = searchParams.get("range") || "24h";

    if (!organizationId) {
      return StandardErrorResponse.badRequest(
        "Organization ID is required",
        undefined,
        requestId,
      );
    }

    // Check if user has access to the organization
    const hasAccess = await MembershipService.hasUserAccess(
      organizationId,
      userId,
    );
    if (!hasAccess) {
      return StandardErrorResponse.forbidden(
        "Access denied to organization",
        requestId,
      );
    }

    // Calculate time range
    const now = new Date();
    let startTime: Date;

    switch (range) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const metrics = await SecurityService.getSecurityMetrics(organizationId, {
      startDate: startTime,
      endDate: now,
    });

    return StandardSuccessResponse.create(
      { metrics },
      {
        range,
        organizationId,
        timeRange: {
          start: startTime.toISOString(),
          end: now.toISOString(),
        },
      },
    );
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      requestId,
      endpoint: "/api/security/metrics",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process security request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
