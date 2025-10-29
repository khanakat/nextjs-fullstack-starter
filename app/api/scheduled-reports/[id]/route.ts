import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { z } from "zod";

const updateScheduledReportSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  description: z.string().optional(),
  schedule: z
    .object({
      frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
      time: z
        .string()
        .regex(
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Invalid time format (HH:MM)",
        ),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      timezone: z.string().default("UTC"),
    })
    .optional(),
  recipients: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one recipient required")
    .optional(),
  format: z.enum(["pdf", "xlsx", "csv"]).optional(),
  options: z
    .object({
      includeCharts: z.boolean().optional(),
      includeData: z.boolean().optional(),
      includeMetadata: z.boolean().optional(),
      customMessage: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Get scheduled reports for the organization and filter by ID
    const result = await ScheduledReportsService.getScheduledReports(
      organizationId,
      {
        page: 1,
        limit: 1000, // Get all to find the specific one
      },
    );

    const scheduledReport = result.scheduledReports.find(
      (sr: any) => sr.id === params.id,
    );

    if (!scheduledReport) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(scheduledReport);
  } catch (error) {
    console.error("Error fetching scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled report" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = updateScheduledReportSchema.parse(body);

    // Update the scheduled report
    const updatedReport = await ScheduledReportsService.updateScheduledReport(
      params.id,
      session.user.id,
      validatedData,
    );

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("Error updating scheduled report:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message.includes("access denied")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to update scheduled report" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the scheduled report
    await ScheduledReportsService.deleteScheduledReport(
      params.id,
      session.user.id,
    );

    return NextResponse.json({
      message: "Scheduled report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled report:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message.includes("access denied")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to delete scheduled report" },
      { status: 500 },
    );
  }
}
