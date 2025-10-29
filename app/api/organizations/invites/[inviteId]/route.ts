import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { MembershipService } from "@/lib/services/organization-service";
import { db } from "@/lib/db";

/**
 * POST /api/organizations/invites/[inviteId]
 * Accept organization invite
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { inviteId: string } },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await MembershipService.acceptInvite(
      params.inviteId,
      user.id,
    );

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error accepting invite:", error);

    if (error instanceof Error) {
      if (error.message.includes("Invite not found")) {
        return NextResponse.json(
          { error: "Invite not found or expired" },
          { status: 404 },
        );
      }
      if (error.message.includes("already a member")) {
        return NextResponse.json(
          { error: "You are already a member of this organization" },
          { status: 409 },
        );
      }
      if (error.message.includes("member limit")) {
        return NextResponse.json(
          { error: "Organization has reached its member limit" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/organizations/invites/[inviteId]
 * Cancel/decline organization invite
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { inviteId: string } },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First get the invite to find the organization ID
    const invite = await db.organizationInvite.findUnique({
      where: { id: params.inviteId },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await MembershipService.cancelInvite(
      invite.organizationId,
      params.inviteId,
      user.id,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling invite:", error);

    if (error instanceof Error) {
      if (error.message.includes("Invite not found")) {
        return NextResponse.json(
          { error: "Invite not found" },
          { status: 404 },
        );
      }
      if (error.message.includes("Insufficient permissions")) {
        return NextResponse.json(
          { error: "Insufficient permissions to cancel this invite" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 },
    );
  }
}
