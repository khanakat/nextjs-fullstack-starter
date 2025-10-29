import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  MembershipService,
  OrganizationService,
} from "@/lib/services/organization-service";

import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";

// Validation schemas
const updateMemberSchema = z.object({
  role: z.enum(["admin", "member", "viewer"], {
    errorMap: () => ({ message: "Role must be admin, member, or viewer" }),
  }),
});

/**
 * PUT /api/organizations/[id]/members/[memberId]
 * Update member role
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string; memberId: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Updating organization member", "organizations", {
      requestId,
      organizationId: params.id,
      memberId: params.memberId,
    });

    const user = await currentUser();
    if (!user) {
      logger.warn("Unauthorized access attempt", "organizations", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Unauthorized",
        "organizations",
        requestId,
      );
    }

    const body = await _request.json();

    // Validate request body
    const validationResult = updateMemberSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Validation failed for member update", "organizations", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error, requestId);
    }

    const { role } = validationResult.data;

    // Check if user has permission to update members
    const userMembership = await OrganizationService.getUserMembership(
      params.id,
      user.id,
    );

    if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
      logger.warn(
        "Insufficient permissions to update member",
        "organizations",
        {
          requestId,
          userId: user.id,
          organizationId: params.id,
          userRole: userMembership?.role,
        },
      );
      return StandardErrorResponse.forbidden(
        "Insufficient permissions",
        requestId,
      );
    }

    // Update member role
    const updatedMember = await MembershipService.updateMember(
      params.id,
      params.memberId,
      user.id,
      { role },
    );

    logger.info("Member role updated successfully", "organizations", {
      requestId,
      organizationId: params.id,
      memberId: params.memberId,
      newRole: role,
    });

    return StandardSuccessResponse.ok(
      {
        member: updatedMember,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Failed to update member role", "organizations", error);

    if (error instanceof Error) {
      if (error.message.includes("Insufficient permissions")) {
        return StandardErrorResponse.forbidden(
          "Insufficient permissions to update member",
          requestId,
        );
      }
      if (error.message.includes("Member not found")) {
        return StandardErrorResponse.notFound("Member", requestId);
      }
    }

    return StandardErrorResponse.internal(
      "Failed to update member",
      null,
      requestId,
    );
  }
}

/**
 * DELETE /api/organizations/[id]/members/[memberId]
 * Remove member from organization
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; memberId: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Removing organization member", "organizations", {
      requestId,
      organizationId: params.id,
      memberId: params.memberId,
    });

    const user = await currentUser();
    if (!user) {
      logger.warn("Unauthorized access attempt", "organizations", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Unauthorized",
        "organizations",
        requestId,
      );
    }

    // Check if user has permission to remove members
    const userMembership = await OrganizationService.getUserMembership(
      params.id,
      user.id,
    );

    if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
      logger.warn(
        "Insufficient permissions to remove member",
        "organizations",
        {
          requestId,
          userId: user.id,
          organizationId: params.id,
          userRole: userMembership?.role,
        },
      );
      return StandardErrorResponse.forbidden(
        "Insufficient permissions",
        requestId,
      );
    }

    // Remove member
    await MembershipService.removeMember(params.id, params.memberId, user.id);

    logger.info("Member removed successfully", "organizations", {
      requestId,
      organizationId: params.id,
      memberId: params.memberId,
    });

    return StandardSuccessResponse.ok({ success: true }, requestId);
  } catch (error) {
    logger.error("Failed to remove member", "organizations", error);

    if (error instanceof Error) {
      if (error.message.includes("Insufficient permissions")) {
        return StandardErrorResponse.forbidden(
          "Insufficient permissions to remove member",
          requestId,
        );
      }
      if (error.message.includes("Member not found")) {
        return StandardErrorResponse.notFound("Member", requestId);
      }
    }

    return StandardErrorResponse.internal(
      "Failed to remove member",
      null,
      requestId,
    );
  }
}
