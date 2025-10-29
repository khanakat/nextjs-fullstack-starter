import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { MembershipService } from "@/lib/services/organization-service";
import { InviteMemberRequest } from "@/lib/types/organizations";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { z } from "zod";

// Validation schemas
const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member", "viewer"], {
    errorMap: () => ({ message: "Role must be admin, member, or viewer" }),
  }),
});

/**
 * GET /api/organizations/[id]/members
 * Get organization members and invites
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

    logger.info("Fetching organization members", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
    });

    const { members, invites } = await MembershipService.getOrganizationMembers(
      params.id,
      user.id,
    );

    logger.info("Organization members fetched successfully", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
      membersCount: members.length,
      invitesCount: invites.length,
    });

    return StandardSuccessResponse.paginated(
      [
        ...members.map((member) => ({ ...member, type: "member" })),
        ...invites.map((invite) => ({ ...invite, type: "invite" })),
      ],
      {
        page: 1,
        limit: 50,
        total: members.length + invites.length,
      },
      "Organization members and invites retrieved successfully",
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Access denied") {
      logger.apiError(
        "Access denied for organization members",
        "organizations",
        error,
        {
          requestId,
          organizationId: params.id,
        },
      );

      return StandardErrorResponse.forbidden(
        "Access denied to organization members",
        requestId,
      );
    }

    logger.apiError(
      "Error fetching organization members",
      "organizations",
      error,
      {
        requestId,
        organizationId: params.id,
      },
    );

    return StandardErrorResponse.internal(
      "Failed to fetch organization members",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}

/**
 * POST /api/organizations/[id]/members
 * Invite member to organization
 */
export async function POST(
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
    const validationResult = inviteMemberSchema.safeParse(body);
    if (!validationResult.success) {
      logger.apiError(
        "Member invitation validation failed",
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

    const data: InviteMemberRequest = validationResult.data;

    logger.info("Inviting member to organization", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
      inviteEmail: data.email,
      inviteRole: data.role,
    });

    const invite = await MembershipService.inviteMember(
      params.id,
      user.id,
      data,
    );

    logger.info("Member invited successfully", "organizations", {
      requestId,
      userId: user.id,
      organizationId: params.id,
      inviteId: invite.id,
      inviteEmail: data.email,
    });

    return StandardSuccessResponse.created(invite, requestId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Insufficient permissions")) {
        logger.apiError(
          "Insufficient permissions for member invitation",
          "organizations",
          error,
          {
            requestId,
            organizationId: params.id,
          },
        );

        return StandardErrorResponse.forbidden(
          "Insufficient permissions to invite members",
          requestId,
        );
      }

      if (error.message.includes("already a member")) {
        logger.apiError("User already a member", "organizations", error, {
          requestId,
          organizationId: params.id,
        });

        return StandardErrorResponse.conflict(
          "User is already a member of this organization",
          requestId,
        );
      }

      if (error.message.includes("pending invite")) {
        logger.apiError(
          "Pending invite already exists",
          "organizations",
          error,
          {
            requestId,
            organizationId: params.id,
          },
        );

        return StandardErrorResponse.conflict(
          "There is already a pending invite for this email",
          requestId,
        );
      }

      if (error.message.includes("member limit")) {
        logger.apiError(
          "Organization member limit reached",
          "organizations",
          error,
          {
            requestId,
            organizationId: params.id,
          },
        );

        return StandardErrorResponse.conflict(
          "Organization has reached its member limit",
          requestId,
        );
      }
    }

    logger.apiError("Error inviting member", "organizations", error, {
      requestId,
      organizationId: params.id,
    });

    return StandardErrorResponse.internal(
      "Failed to invite member",
      { error: error instanceof Error ? error.message : "Unknown error" },
      requestId,
    );
  }
}
