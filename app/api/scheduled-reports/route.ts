import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { 
  ScheduledReportError, 
  ScheduledReportNotFoundError, 
  ScheduledReportValidationError 
} from "@/lib/types/scheduled-reports";
import { 
  handleScheduledReportsError, 
  validateRequestAuth,
  createSuccessResponse 
} from "@/lib/middleware/scheduled-reports-error-handler";
import { 
  validateCreateScheduledReportRequest 
} from "@/lib/utils/scheduled-reports-validation";
import { generalRateLimiter, createRateLimitResponse } from "@/lib/utils/rate-limiter";
import { z } from "zod";

const createScheduledReportSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  reportId: z.string().uuid("Invalid report ID"),
  schedule: z.string().min(1, "Schedule is required"),
  timezone: z.string().default("UTC"),
  recipients: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one recipient required")
    .max(50, "Maximum 50 recipients allowed"),
  format: z.enum(["pdf", "xlsx", "csv"]),
  options: z
    .object({
      includeCharts: z.boolean().default(true),
      includeData: z.boolean().default(true),
      includeMetadata: z.boolean().default(false),
      customMessage: z.string().max(1000, "Custom message too long").optional(),
      filters: z.record(z.any()).optional(),
      dateRange: z.object({
        type: z.enum(['last_7_days', 'last_30_days', 'last_quarter', 'custom']),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
    })
    .default({}),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  // Support demo mode - if no session, use demo data
  const userId = session?.user?.id || "demo-user";
  const orgId = organizationId || "demo-org";

  try {

    // Rate limiting
    const rateLimitKey = `get-reports-${userId}-${orgId}`;
    const isDemo = userId === "demo-user";
    if (!generalRateLimiter.isAllowed(rateLimitKey, isDemo)) {
      return createRateLimitResponse(generalRateLimiter.getResetTime(rateLimitKey));
    }

    // Skip auth validation for demo mode
    if (userId !== "demo-user") {
      validateRequestAuth(session?.user?.id, organizationId || undefined);
    }

    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const page = Math.floor(offset / limit) + 1;

    const filters = {
      organizationId: organizationId!,
      isActive:
        searchParams.get("isActive") === "true"
          ? true
          : searchParams.get("isActive") === "false"
            ? false
            : undefined,
      reportId: searchParams.get("reportId") || undefined,
      format: searchParams.get("format") as 'pdf' | 'xlsx' | 'csv' | undefined,
      search: searchParams.get("search") || undefined,
      page: page,
      limit: limit,
    };

    // Return demo data for demo mode
    if (userId === "demo-user") {
      const demoReports = {
        reports: [
          {
            id: "demo-report-1",
            name: "Weekly Sales Report",
            description: "Automated weekly sales summary",
            status: "active",
            schedule: "0 9 * * 1", // Every Monday at 9 AM
            nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            organizationId: "demo-org",
            createdBy: "demo-user",
            reportConfig: {
              type: "sales",
              format: "pdf",
              recipients: ["manager@company.com"]
            }
          },
          {
            id: "demo-report-2",
            name: "Monthly Analytics",
            description: "Monthly performance analytics",
            status: "active",
            schedule: "0 8 1 * *", // First day of month at 8 AM
            nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            organizationId: "demo-org",
            createdBy: "demo-user",
            reportConfig: {
              type: "analytics",
              format: "excel",
              recipients: ["analytics@company.com"]
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };
      return createSuccessResponse(demoReports);
    }

    const result = await ScheduledReportsService.getScheduledReports(userId, filters);

    return createSuccessResponse(result, "Scheduled reports retrieved successfully");
  } catch (error) {
    return handleScheduledReportsError(error, {
      operation: 'get_scheduled_reports',
      userId: userId,
      organizationId: orgId,
      path: request.url,
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { organizationId, ...data } = body;

  // Support demo mode - if no session, use demo data
  const userId = session?.user?.id || "demo-user";
  const orgId = organizationId || "demo-org";

  try {

    // Rate limiting
    const rateLimitKey = `create-report-${userId}-${orgId}`;
    const isDemo = userId === "demo-user";
    if (!generalRateLimiter.isAllowed(rateLimitKey, isDemo)) {
      return createRateLimitResponse(generalRateLimiter.getResetTime(rateLimitKey));
    }

    // Skip auth validation for demo mode
    if (userId !== "demo-user") {
      validateRequestAuth(session?.user?.id, organizationId);
    }

    // Validate the request body with Zod
    const validatedData = createScheduledReportSchema.parse(data);

    // Return demo response for demo mode
    if (userId === "demo-user") {
      const demoReport = {
        id: `demo-report-${Date.now()}`,
        name: validatedData.name,
        description: validatedData.description || "",
        status: "active",
        schedule: validatedData.schedule,
        timezone: validatedData.timezone,
        recipients: validatedData.recipients,
        format: validatedData.format,
        options: validatedData.options,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastRun: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        organizationId: orgId,
        createdBy: userId,
        reportConfig: {
          type: "custom",
          format: validatedData.format,
          recipients: validatedData.recipients
        }
      };
      
      return createSuccessResponse(
        demoReport, 
        "Scheduled report created successfully (demo mode)",
        { scheduledReportId: demoReport.id }
      );
    }

    // Additional business logic validation
    validateCreateScheduledReportRequest({
      ...validatedData,
      organizationId,
    });

    // Create the scheduled report
    const scheduledReport = await ScheduledReportsService.createScheduledReport(
      session!.user!.id,
      {
        ...validatedData,
        organizationId,
      }
    );

    return createSuccessResponse(
      scheduledReport, 
      "Scheduled report created successfully",
      { scheduledReportId: scheduledReport.id }
    );
  } catch (error) {
    return handleScheduledReportsError(error, {
      operation: 'create_scheduled_report',
      userId: userId,
      organizationId: orgId,
      path: request.url,
    });
  }
}
