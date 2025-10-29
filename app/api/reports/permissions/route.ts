import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createPermissionSchema = z.object({
  reportId: z.string(),
  userId: z.string(),
  permission: z.enum(["read", "write", "admin"]),
});

// GET /api/reports/permissions - Get report permissions for a user
export async function GET(_request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 },
      );
    }

    // Get all permissions for the report
    const permissions = await db.reportPermission.findMany({
      where: { reportId },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          },
        },
      },
    });

    // Check if user has access to view permissions
    const report = permissions[0]?.report;
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const userPermission = permissions.find((p) => p.userId === userId);
    const isOwner = report.createdBy === userId;
    const hasAdminAccess =
      userPermission?.permissionType === "admin" || isOwner;

    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    logger.apiError("Error processing report request", "report", error, {
      endpoint: "/api/reports/permissions",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process report request", 500);
  }
}

// POST /api/reports/permissions - Create a new permission
export async function POST(_request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await _request.json();
    const validatedData = createPermissionSchema.parse(body);

    // Check if user has admin access to the report
    const report = await db.report.findUnique({
      where: { id: validatedData.reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const userPermission = await db.reportPermission.findFirst({
      where: {
        userId,
        reportId: validatedData.reportId,
      },
    });

    const isOwner = report.createdBy === userId;
    const hasAdminAccess =
      userPermission?.permissionType === "admin" || isOwner;

    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if permission already exists
    const existingPermission = await db.reportPermission.findFirst({
      where: {
        userId: validatedData.userId,
        reportId: validatedData.reportId,
      },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "Permission already exists" },
        { status: 409 },
      );
    }

    // Create permission
    const permission = await db.reportPermission.create({
      data: {
        userId: validatedData.userId,
        reportId: validatedData.reportId,
        permissionType: validatedData.permission,
      },
      include: {
        report: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.apiError(
      "Error processing report permissions request",
      "report",
      error,
      {
        endpoint: "/api/reports/permissions",
      },
    );

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process report permissions request", 500);
  }
}
