import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { SecurityService } from "@/lib/services/security-service";
import { MembershipService } from "@/lib/services/organization-service";

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);
    const organizationId = searchParams.get("organizationId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Check if user has access to the organization
    const hasAccess = await MembershipService.hasUserAccess(
      organizationId,
      userId,
    );
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const events = await SecurityService.getSecurityEvents(
      { organizationId },
      { page: Math.floor(offset / limit) + 1, limit },
    );

    return NextResponse.json({ events });
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      endpoint: "/api/security/events",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process security request", 500);
  }
}

export async function PATCH(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await _request.json();
    const { eventId, resolved } = body;

    if (!eventId || typeof resolved !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Get the event to check organization access
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has access to the organization
    const hasAccess = event.organizationId
      ? await MembershipService.hasUserAccess(event.organizationId, userId)
      : true;
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedEvent = await prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        status: resolved ? "resolved" : "open",
        resolvedBy: resolved ? userId : null,
        resolvedAt: resolved ? new Date() : null,
      },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      endpoint: "/api/security/events",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process security request", 500);
  }
}
