import { NextRequest } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { currentUser } from "@clerk/nextjs/server";
import { OrganizationService } from "@/lib/services/organization-service";
import { UpdateOrganizationRequest } from "@/lib/types/organizations";
import { generateRequestId } from "@/lib/utils";
import { z } from "zod";

// Validation schemas
const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  settings: z.record(z.any()).optional(),
});

/**
 * GET /api/organizations/[id]
 * Get organization by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    logger.info("Fetching organization by ID", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
    });

    const organization = await OrganizationService.getOrganization(
      params.id,
      user.id,
    );

    if (!organization) {
      logger.info("Organization not found", "organizations", {
        requestId,
        userId: user.id,
        organizationId: params.id,
      });

      return StandardErrorResponse.notFound(
        "Organization not found",
        requestId,
      );
    }

    logger.info("Organization retrieved successfully", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
      organizationName: organization.name,
    });

    return StandardSuccessResponse.ok(organization, requestId);
  } catch (error) {
    logger.apiError(
      "Error processing organization request",
      "organizations",
      error,
      {
        requestId,
        resourceId: params.id,
        endpoint: "/api/organizations/:id",
      },
    );

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return StandardErrorResponse.internal(
      "Failed to retrieve organization",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * Update organization
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
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
    const validationResult = updateOrganizationSchema.safeParse(body);
    if (!validationResult.success) {
      logger.apiError(
        "Organization update validation failed",
        "organizations",
        validationResult.error,
        {
          requestId,
          userId: user.id,
          organizationId: params.id,
          validationErrors: validationResult.error.errors,
        },
      );

      return StandardErrorResponse.validation(
        validationResult.error,
        requestId,
      );
    }

    const data: UpdateOrganizationRequest = validationResult.data;

    logger.info("Updating organization", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
      updateFields: Object.keys(data),
    });

    const organization = await OrganizationService.updateOrganization(
      params.id,
      user.id,
      data,
    );

    logger.info("Organization updated successfully", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
      organizationName: organization.name,
    });

    return StandardSuccessResponse.updated(organization, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Insufficient permissions")) {
        logger.apiError(
          "Insufficient permissions for organization update",
          "organizations",
          error,
          {
            requestId,
            organizationId: params.id,
          },
        );

        return StandardErrorResponse.forbidden(
          "Insufficient permissions to update organization",
          requestId,
        );
      }

      if (error.message.includes("Organization not found")) {
        logger.info("Organization not found for update", "organizations", {
          requestId,
          organizationId: params.id,
        });

        return StandardErrorResponse.notFound(
          "Organization not found",
          requestId,
        );
      }

      if (error.message.includes("Slug already exists")) {
        logger.apiError("Organization slug conflict", "organizations", error, {
          requestId,
          organizationId: params.id,
        });

        return StandardErrorResponse.conflict(
          "Organization slug already exists",
          requestId,
        );
      }
    }

    logger.apiError("Error updating organization", "organizations", error, {
      requestId,
      organizationId: params.id,
    });

    return StandardErrorResponse.internal(
      "Failed to update organization",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    logger.info("Deleting organization", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
    });

    await OrganizationService.deleteOrganization(params.id, user.id);

    logger.info("Organization deleted successfully", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
    });

    return StandardSuccessResponse.deleted(requestId, {
      message: "Organization deleted successfully",
      organizationId: params.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Only organization owner")) {
        logger.apiError(
          "Insufficient permissions for organization deletion",
          "organizations",
          error,
          {
            requestId,
            organizationId: params.id,
          },
        );

        return StandardErrorResponse.forbidden(
          "Only organization owner can delete the organization",
          requestId,
        );
      }

      if (error.message.includes("Organization not found")) {
        logger.info("Organization not found for deletion", "organizations", {
          requestId,
          organizationId: params.id,
        });

        return StandardErrorResponse.notFound(
          "Organization not found",
          requestId,
        );
      }
    }

    logger.apiError("Error deleting organization", "organizations", error, {
      requestId,
      organizationId: params.id,
    });

    return StandardErrorResponse.internal(
      "Failed to delete organization",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}
