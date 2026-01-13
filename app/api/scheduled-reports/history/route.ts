import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { ScheduledReportError } from "@/lib/types/scheduled-reports";
import { generalRateLimiter, createRateLimitResponse } from "@/lib/utils/rate-limiter";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  // Support demo mode - if no session, use demo data
  const userId = session?.user?.id || "demo-user";
  const orgId = organizationId || "demo-org";

  try {

    // Rate limiting
    const rateLimitKey = `history-${userId}-${orgId}`;
    const isDemo = userId === "demo-user";
    if (!generalRateLimiter.isAllowed(rateLimitKey, isDemo)) {
      return createRateLimitResponse(generalRateLimiter.getResetTime(rateLimitKey));
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const scheduledReportId = searchParams.get("scheduledReportId") || undefined;

    // Return demo data for demo mode
    if (userId === "demo-user") {
      const demoHistory = {
        executions: [
          {
            id: "demo-exec-1",
            scheduledReportId: "demo-report-1",
            reportName: "Weekly Sales Report",
            status: "completed",
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
            duration: 45000,
            fileSize: 2048576,
            downloadUrl: "/api/reports/demo-exec-1/download",
            error: null
          },
          {
            id: "demo-exec-2",
            scheduledReportId: "demo-report-2",
            reportName: "Monthly Analytics",
            status: "failed",
            startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30000).toISOString(),
            duration: 30000,
            fileSize: null,
            downloadUrl: null,
            error: "Database connection timeout"
          },
          {
            id: "demo-exec-3",
            scheduledReportId: "demo-report-1",
            reportName: "Weekly Sales Report",
            status: "completed",
            startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 42000).toISOString(),
            duration: 42000,
            fileSize: 1987654,
            downloadUrl: "/api/reports/demo-exec-3/download",
            error: null
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1
        }
      };
      return NextResponse.json(demoHistory);
    }

    // Use the scheduled reports service to get execution history
    // Si hay un scheduledReportId específico, obtener las ejecuciones de ese reporte
    // Si no, obtener todas las ejecuciones de la organización
    let result;
    
    if (scheduledReportId) {
      // Obtener ejecuciones de un reporte específico
      const offset = (page - 1) * limit;
      const runsResult = await ScheduledReportsService.getScheduledReportRuns(
        scheduledReportId,
        userId,
        orgId,
        {
          status: status as any,
          limit,
          offset,
          sortBy: 'startedAt',
          sortOrder: 'desc',
        }
      );
      
      // Mapear los runs al formato esperado por el frontend
      result = {
        executions: runsResult.runs.map(run => ({
          id: run.id,
          scheduledReportId: run.scheduledReportId,
          reportName: 'Scheduled Report',
          status: run.status,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          duration: run.duration,
          fileSize: run.fileSize,
          downloadUrl: run.downloadUrl,
          error: run.errorMessage,
        })),
        pagination: {
          page,
          limit,
          total: runsResult.total,
          totalPages: Math.ceil(runsResult.total / limit),
        }
      };
    } else {
      // Para obtener todas las ejecuciones de la organización, necesitaríamos un método diferente
      // Por ahora, devolver array vacío con mensaje informativo
      result = {
        executions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        }
      };
      
      logger.warn('Getting all execution history for organization not yet implemented', 'API', {
        organizationId: orgId,
        userId
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const requestId = crypto.randomUUID();
    
    if (error instanceof ScheduledReportError) {
      logger.warn("Scheduled report history error", "API", {
        error: error.message,
        code: error.code,
        requestId,
        organizationId: organizationId,
        userId
      });
      
      return NextResponse.json(
        { 
          error: error.message, 
          code: error.code,
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    logger.error("Error fetching execution history", "API", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      organizationId: orgId,
      userId
    });
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
