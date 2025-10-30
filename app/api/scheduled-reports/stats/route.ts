import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ScheduledReportsService } from "@/lib/services/scheduled-reports-service";
import { ScheduledReportError } from "@/lib/types/scheduled-reports";
import { statsRateLimiter, createRateLimitResponse } from "@/lib/utils/rate-limiter";
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
    const rateLimitKey = `stats-${userId}-${orgId}`;
    const isDemo = userId === "demo-user";
    if (!statsRateLimiter.isAllowed(rateLimitKey, isDemo)) {
      return createRateLimitResponse(statsRateLimiter.getResetTime(rateLimitKey));
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : undefined;
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate")!) 
      : undefined;

    // Return demo data for demo mode
    if (userId === "demo-user") {
      const demoStats = {
        totalReports: 5,
        activeReports: 3,
        totalExecutions: 42,
        successfulExecutions: 38,
        failedExecutions: 4,
        successRate: 90.5,
        todayExecutions: 3,
        nextExecution: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        avgExecutionTime: 45000, // 45 seconds
        recentActivity: [
          {
            id: "demo-activity-1",
            type: "execution_completed",
            reportName: "Weekly Sales Report",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: "success"
          },
          {
            id: "demo-activity-2", 
            type: "execution_started",
            reportName: "Monthly Analytics",
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            status: "running"
          }
        ]
      };
      return NextResponse.json(demoStats);
    }

    const stats = await ScheduledReportsService.getScheduledReportStats(
      organizationId,
      { startDate, endDate }
    );

    return NextResponse.json(stats);
  } catch (error) {
    const requestId = crypto.randomUUID();
    
    if (error instanceof ScheduledReportError) {
      logger.warn("Scheduled report stats error", "API", {
        error: error.message,
        code: error.code,
        requestId,
        organizationId: orgId,
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

    logger.error("Error fetching scheduled report stats", "API", {
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