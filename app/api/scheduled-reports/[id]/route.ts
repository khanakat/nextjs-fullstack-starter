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
  validateUpdateScheduledReportRequest 
} from "@/lib/utils/scheduled-reports-validation";
import { safeRequestJson, getOrganizationId } from "@/lib/utils/request-helpers";
import { z } from "zod";

const updateScheduledReportSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  schedule: z.string().min(1, "Schedule is required").optional(),
  timezone: z.string().optional(),
  recipients: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one recipient required")
    .max(50, "Maximum 50 recipients allowed")
    .optional(),
  format: z.enum(["pdf", "xlsx", "csv"]).optional(),
  options: z
    .object({
      includeCharts: z.boolean().optional(),
      includeData: z.boolean().optional(),
      includeMetadata: z.boolean().optional(),
      customMessage: z.string().max(1000, "Custom message too long").optional(),
      filters: z.record(z.any()).optional(),
      dateRange: z.object({
        type: z.enum(['last_7_days', 'last_30_days', 'last_quarter', 'custom']),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
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
    const { searchParams } = new URL(request.url);
    const organizationId =
      searchParams.get("organizationId") || request.headers.get("x-organization-id");

    // Validate authentication and required parameters
    validateRequestAuth(session?.user?.id, organizationId || undefined);

    // Validate scheduled report ID format
    if (!params.id || typeof params.id !== 'string') {
      throw new ScheduledReportValidationError('id', params.id, 'Invalid scheduled report ID');
    }

    // Get the specific scheduled report
    const scheduledReport = await ScheduledReportsService.getScheduledReportById(
      params.id,
      session!.user!.id,
    );

    return createSuccessResponse(scheduledReport, "Scheduled report retrieved successfully");
  } catch (error) {
    return handleScheduledReportsError(error, {
      operation: 'get_scheduled_report',
      userId: (await getServerSession(authOptions))?.user?.id,
      organizationId: (
        new URL(request.url).searchParams.get("organizationId") ||
        request.headers.get("x-organization-id") || undefined
      ),
      scheduledReportId: params.id,
      path: request.url,
    });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  let organizationId: string | undefined = undefined;
  
  try {
    const session = await getServerSession(authOptions);
    
    // Safely parse request body
    const body = await safeRequestJson<{ organizationId?: string; [key: string]: any }>(request);
    const { organizationId: orgId, ...updates } = body;
    organizationId = orgId || getOrganizationId(request);

    // Validate authentication and required parameters
    validateRequestAuth(session?.user?.id, organizationId);

    // Validate scheduled report ID format
    if (!params.id || typeof params.id !== 'string') {
      throw new ScheduledReportValidationError('id', params.id, 'Invalid scheduled report ID');
    }

    // Validate the request body with Zod
    const validatedUpdates = updateScheduledReportSchema.parse(updates);

    // Additional business logic validation
    validateUpdateScheduledReportRequest(validatedUpdates);

    // Update the scheduled report
    const updatedReport = await ScheduledReportsService.updateScheduledReport(
      params.id,
      session!.user!.id,
      validatedUpdates,
    );

    return createSuccessResponse(
      updatedReport, 
      "Scheduled report updated successfully",
      { scheduledReportId: params.id }
    );
  } catch (error) {
    return handleScheduledReportsError(error, {
      operation: 'update_scheduled_report',
      userId: (await getServerSession(authOptions))?.user?.id,
      organizationId: organizationId,
      scheduledReportId: params.id,
      path: request.url,
    });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let organizationId: string | undefined = undefined;
  
  try {
    const session = await getServerSession(authOptions);
    organizationId = getOrganizationId(request);

    // Validate authentication and required parameters
    validateRequestAuth(session?.user?.id, organizationId || undefined);

    // Validate scheduled report ID format
    if (!params.id || typeof params.id !== 'string') {
      throw new ScheduledReportValidationError('id', params.id, 'Invalid scheduled report ID');
    }

    // Delete the scheduled report
    await ScheduledReportsService.deleteScheduledReport(
      params.id,
      session!.user!.id,
    );

    return createSuccessResponse(
      { deleted: true }, 
      "Scheduled report deleted successfully",
      { scheduledReportId: params.id }
    );
  } catch (error) {
    return handleScheduledReportsError(error, {
      operation: 'delete_scheduled_report',
      userId: (await getServerSession(authOptions))?.user?.id,
      organizationId: organizationId || undefined,
      scheduledReportId: params.id,
      path: request.url,
    });
  }
}
