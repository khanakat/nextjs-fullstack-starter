import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { z } from "zod";
import { ReportStatus } from "@/lib/types/reports";
import { ReportService } from "@/lib/services/report-service";
import { ApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";

// Validation schemas
const createReportSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  templateId: z.string().optional(),
  config: z.object({
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
  }),
  isPublic: z.boolean().default(false),
});

// GET /api/reports - List reports with pagination and filters
export async function GET(_request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = auth();
    if (!userId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as ReportStatus;
    const templateId = searchParams.get("templateId") || "";
    const organizationId =
      searchParams.get("organizationId") ||
      _request.headers.get("x-organization-id") ||
      undefined;

    const filters = {
      search: search || undefined,
      status: status || undefined,
      templateId: templateId || undefined,
    };

    const result = await ReportService.getReports(
      userId,
      organizationId,
      filters,
      page,
      limit,
    );

    return StandardSuccessResponse.create(result, {
      pagination: {
        page,
        limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / limit),
      },
    });
  } catch (error) {
    logger.apiError("Error processing report request", "report", error, {
      requestId,
      endpoint: "GET /api/reports",
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

// POST /api/reports - Create a new report
export async function POST(_request: NextRequest) {
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
    const validatedData = createReportSchema.parse(body);
    const organizationId =
      _request.headers.get("x-organization-id") || undefined;

    const report = await ReportService.createReport(
      userId,
      validatedData,
      organizationId,
    );

    return StandardSuccessResponse.create(
      { report },
      { message: "Report created successfully" },
      201,
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

    logger.apiError("Error creating report", "report", error, {
      requestId,
      endpoint: "POST /api/reports",
    });

    if (error instanceof ApiError) {
      return StandardErrorResponse.fromApiError(error, requestId);
    }

    return StandardErrorResponse.internal(
      "Failed to create report",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
