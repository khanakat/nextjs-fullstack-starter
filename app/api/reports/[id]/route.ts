import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";

import { z } from "zod";
import { ReportStatus } from "@/lib/types/reports";
import { ReportService } from "@/lib/services/report-service";
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
  status: z.nativeEnum(ReportStatus).optional(),
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

    const organizationId =
      _request.headers.get("x-organization-id") || undefined;
    const report = await ReportService.getReportById(
      params.id,
      userId,
      organizationId,
    );

    if (!report) {
      return StandardErrorResponse.notFound("Report", requestId);
    }

    return StandardSuccessResponse.create({ report });
  } catch (error) {
    logger.apiError("Error processing report request", "report", error, {
      requestId,
      resourceId: params.id,
      endpoint: "/api/reports/:id",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process report request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
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
    const organizationId =
      _request.headers.get("x-organization-id") || undefined;

    const updatedReport = await ReportService.updateReport(
      params.id,
      userId,
      validatedData,
      organizationId,
    );

    return StandardSuccessResponse.create(
      { report: updatedReport },
      { message: "Report updated successfully" },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return StandardErrorResponse.badRequest(
        "Validation error",
        "validation",
        { validationErrors: error.errors },
        requestId,
      );
    }

    logger.apiError("Error processing report request", "report", error, {
      requestId,
      reportId: params.id,
      endpoint: "/api/reports/:id",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process report request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
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

    const organizationId =
      _request.headers.get("x-organization-id") || undefined;
    await ReportService.deleteReport(params.id, userId, organizationId);

    return StandardSuccessResponse.create(null, {
      message: "Report deleted successfully",
    });
  } catch (error) {
    logger.apiError("Error processing report request", "report", error, {
      requestId,
      resourceId: params.id,
      endpoint: "/api/reports/:id",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to process report request",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
