import { NextRequest } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { currentUser } from "@clerk/nextjs/server";
import { OrganizationService } from "@/lib/services/organization-service";
import { CreateOrganizationRequest } from "@/lib/types/organizations";
import { generateRequestId } from "@/lib/utils";
import { z } from "zod";

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

/**
 * GET /api/organizations
 * Get all organizations for the current user
 */
export async function GET() {
  const requestId = generateRequestId();

  try {
    const user = await currentUser();
    if (!user) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "organizations",
        requestId,
      );
    }

    logger.info("Fetching user organizations", "organizations", {
      requestId,
      userId: user.id,
    });

    const organizations = await OrganizationService.getUserOrganizations(
      user.id,
    );

    logger.info("Organizations retrieved successfully", "organizations", {
      requestId,
      userId: user.id,
      organizationCount: organizations.length,
    });

    return StandardSuccessResponse.paginated(
      organizations,
      {
        page: 1,
        limit: 50,
        total: organizations.length,
      },
      "Organizations retrieved successfully",
    );
  } catch (error) {
    logger.apiError(
      "Error processing organization request",
      "organizations",
      error,
      {
        requestId,
        endpoint: "/api/organizations",
      },
    );

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return StandardErrorResponse.internal(
      "Failed to retrieve organizations",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = await currentUser();
    if (!user) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        "organizations",
        requestId,
      );
    }

    const body = await _request.json();

    // Validate request body
    const validationResult = createOrganizationSchema.safeParse(body);
    if (!validationResult.success) {
      logger.apiError(
        "Organization creation validation failed",
        "organizations",
        validationResult.error,
        {
          requestId,
          userId: user.id,
          validationErrors: validationResult.error.errors,
        },
      );

      return StandardErrorResponse.validation(
        validationResult.error,
        requestId,
      );
    }

    const data: CreateOrganizationRequest = validationResult.data;

    logger.info("Creating organization", "organizations", {
      requestId,
      userId: user.id,
      organizationName: data.name,
      organizationSlug: data.slug,
    });

    const organization = await OrganizationService.createOrganization(
      user.id,
      data,
    );

    logger.info("Organization created successfully", "organizations", {
      requestId,
      userId: user.id,
      organizationId: organization.id,
      organizationName: organization.name,
    });

    return StandardSuccessResponse.created(organization, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Slug already exists")) {
        logger.apiError("Organization slug conflict", "organizations", error, {
          requestId,
        });

        return StandardErrorResponse.conflict(
          "Organization slug already exists",
          requestId,
        );
      }
    }

    logger.apiError("Error creating organization", "organizations", error, {
      requestId,
    });

    return StandardErrorResponse.internal(
      "Failed to create organization",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}
