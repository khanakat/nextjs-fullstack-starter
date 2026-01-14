import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { container } from "@/shared/infrastructure/di/container";
import { ReportTypes } from "@/shared/infrastructure/di/reporting.types";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";

// Validation schema for updates
const updateReportSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  config: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      templateId: z.string().optional(),
      filters: z.record(z.any()),
      parameters: z.record(z.any()),
      layout: z.object({
        components: z.array(z.any()),
        grid: z.object({
          columns: z.number(),
          rows: z.number(),
          gap: z.number(),
        }),
      }),
      styling: z.object({
        theme: z.enum(["light", "dark"]),
        primaryColor: z.string(),
        secondaryColor: z.string(),
        fontFamily: z.string(),
        fontSize: z.number(),
      }),
    })
    .optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// GET /api/reports/[id] - Get a specific report
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportsApiController);

    const result = await controller.getReport(params.id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    // Check permissions
    if (!result.data.isPublic && result.data.createdBy && result.data.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to view this report" },
        { status: 403 },
      );
    }

    return StandardSuccessResponse.ok(result.data, requestId);
  } catch (error) {
    return StandardErrorResponse.internal(
      "Failed to process report request",
      requestId,
    );
  }
}

// PUT /api/reports/[id] - Update a report
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const validatedData = updateReportSchema.parse(body);

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportsApiController);

    const result = await controller.updateReport(params.id, userId, validatedData);

    if (!result.success) {
      return StandardErrorResponse.internal(
        result.error || "Failed to update report",
        requestId,
      );
    }

    return StandardSuccessResponse.ok(result.data, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return StandardErrorResponse.validation(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to update report",
      requestId,
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    // Get controller from DI container
    const controller = container.get<any>(ReportTypes.ReportsApiController);

    const result = await controller.deleteReport(params.id, userId);

    if (!result.success) {
      return StandardErrorResponse.internal(
        result.error || "Failed to delete report",
        requestId,
      );
    }

    return StandardSuccessResponse.ok(
      { message: "Report deleted successfully" },
      requestId
    );
  } catch (error) {
    return StandardErrorResponse.internal(
      "Failed to delete report",
      requestId,
    );
  }
}
