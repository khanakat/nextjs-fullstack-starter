import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { z } from "zod";

const createScheduledReportSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  reportId: z.string().uuid("Invalid report ID"),
  schedule: z.object({
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
  }),
  recipients: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one recipient required"),
  format: z.enum(["pdf", "xlsx", "csv"]),
  options: z
    .object({
      includeCharts: z.boolean().default(true),
      includeData: z.boolean().default(true),
      includeMetadata: z.boolean().default(false),
      customMessage: z.string().optional(),
    })
    .default({}),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
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

    const filters = {
      isActive:
        searchParams.get("isActive") === "true"
          ? true
          : searchParams.get("isActive") === "false"
            ? false
            : undefined,
      reportId: searchParams.get("reportId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await ScheduledReportsService.getScheduledReports(
      organizationId,
      filters,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled reports" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, ...data } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Validate the request body
    const validatedData = createScheduledReportSchema.parse(data);

    // Create the scheduled report
    const scheduledReport = await ScheduledReportsService.createScheduledReport(
      session.user.id,
      organizationId,
      validatedData,
    );

    return NextResponse.json(scheduledReport, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled report:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create scheduled report" },
      { status: 500 },
    );
  }
}
