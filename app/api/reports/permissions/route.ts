import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { container } from "@/shared/infrastructure/di/container";
import { ReportTypes } from "@/shared/infrastructure/di/reporting.types";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";

const createPermissionSchema = z.object({
  reportId: z.string(),
  userId: z.string(),
  permission: z.enum(["read", "write", "admin"]),
});

// GET /api/reports/permissions - Get report permissions for a user
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return StandardErrorResponse.validation(
        {
          issues: [{ message: "Report ID is required" }],
        } as any,
        requestId,
      );
    }

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportsApiController);

    const result = await controller.getReportPermissions({
      reportId,
      userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes("Access denied") ? 403 : 404 },
      );
    }

    return StandardSuccessResponse.ok(result.data, requestId);
  } catch (error) {
    return StandardErrorResponse.internal(
      "Failed to process report permissions request",
      requestId,
    );
  }
}

// POST /api/reports/permissions - Create a new permission
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await request.json();
    const validatedData = createPermissionSchema.parse(body);

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportsApiController);

    const result = await controller.createReportPermission({
      reportId: validatedData.reportId,
      userId,
      targetUserId: validatedData.userId,
      permission: validatedData.permission,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error?.includes("Access denied") ? 403 : 404 },
      );
    }

    return StandardSuccessResponse.created(result.data, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return StandardErrorResponse.validation(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process report permissions request",
      requestId,
    );
  }
}
