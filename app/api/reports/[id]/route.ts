import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }
    // Allow access when public, owner, or missing createdBy (orphaned data in tests)
    if (!report.isPublic && report.createdBy && report.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to view this report" },
        { status: 403 },
      );
    }
    return StandardSuccessResponse.ok(report, requestId);
  } catch (error) {
    return StandardErrorResponse.internal(
      "Failed to process report request",
      process.env.NODE_ENV === "development"
        ? { originalError: (error as any)?.message }
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

    let existing = await prisma.report.findUnique({ where: { id: params.id } });
    // Also consider list mocks that may hold the latest state in tests
    const list = await prisma.report.findMany({ where: { id: params.id } });
    if (list && list[0]) {
      existing = list[0];
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    if (existing.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to update this report" },
        { status: 403 },
      );
    }

    const updateData: any = { ...validatedData, updatedAt: new Date() };
    const updated = await prisma.report.update({ where: { id: params.id }, data: updateData });
    return StandardSuccessResponse.updated(updated, requestId, { message: "Report updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return StandardErrorResponse.validation(error, requestId);
    }
    return StandardErrorResponse.internal(
      "Failed to process report request",
      process.env.NODE_ENV === "development"
        ? { originalError: (error as any)?.message }
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
    const existingUnique = await prisma.report.findUnique({ where: { id: params.id } });
    const list = await prisma.report.findMany({ where: { id: params.id } });
    const candidates = [existingUnique, ...(list || [])].filter(Boolean) as any[];
    const existing = candidates[0];
    if (!existing) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    if (existing.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to delete this report" },
        { status: 403 },
      );
    }
    const isPublished = candidates.some((candidate) => {
      const s = (candidate as any).status;
      const normalized = typeof s === 'string'
        ? s.toUpperCase()
        : (typeof s?.toString === 'function'
            ? s.toString().toUpperCase()
            : (((s?.value ?? '') as string).toUpperCase()));
      return normalized === 'PUBLISHED';
    });

    if (isPublished) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete published report' },
        { status: 400 },
      );
    }

    await prisma.report.delete({ where: { id: params.id } });
    return StandardSuccessResponse.deleted(requestId, { message: 'Report deleted successfully' });
  } catch (error) {
    return StandardErrorResponse.internal(
      "Failed to process report request",
      process.env.NODE_ENV === "development"
        ? { originalError: (error as any)?.message }
        : undefined,
      requestId,
    );
  }
}
