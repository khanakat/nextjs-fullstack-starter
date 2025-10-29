import { NextRequest, NextResponse } from "next/server";
import { getPermissionAuditService } from "@/lib/security/permission-audit";
import { auth } from "@clerk/nextjs/server";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view audit logs
    const user = { id: userId, email: "", role: "MEMBER" as const }; // Would get from database
    if (!hasPermission(user, "read", "audit")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "analytics";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const organizationId = url.searchParams.get("organizationId");
    const userId_param = url.searchParams.get("userId");

    const auditService = getPermissionAuditService();

    switch (type) {
      case "analytics":
        const start = startDate
          ? new Date(startDate)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const analytics = await auditService.getPermissionAnalytics(
          start,
          end,
          organizationId || undefined,
        );

        return NextResponse.json({
          analytics,
          period: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
        });

      case "violations":
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const violations = await auditService.getViolations(
          limit,
          organizationId || undefined,
        );

        return NextResponse.json({ violations });

      case "user-audit":
        if (!userId_param) {
          return NextResponse.json(
            { error: "User ID is required for user audit" },
            { status: 400 },
          );
        }

        const userAudit = await auditService.auditUserPermissions(userId_param);

        return NextResponse.json({ audit: userAudit });

      case "compliance":
        const complianceReport = await auditService.generateComplianceReport(
          organizationId || undefined,
        );

        return NextResponse.json({ compliance: complianceReport });

      default:
        return NextResponse.json(
          { error: "Invalid audit type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error fetching audit data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to manage audit
    const user = { id: userId, email: "", role: "MEMBER" as const }; // Would get from database
    if (!hasPermission(user, "admin", "audit")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action, data } = body;

    const auditService = getPermissionAuditService();

    switch (action) {
      case "resolve_violation":
        const { violationId, resolution } = data;

        if (!violationId) {
          return NextResponse.json(
            { error: "Violation ID is required" },
            { status: 400 },
          );
        }

        const resolved = await auditService.resolveViolation(
          violationId,
          userId,
          resolution || "Resolved by admin",
        );

        if (!resolved) {
          return NextResponse.json(
            { error: "Failed to resolve violation" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Violation resolved",
        });

      case "log_permission_check":
        const {
          targetUserId,
          targetUserEmail,
          targetUserRole,
          resource,
          action: permissionAction,
          granted,
          context,
        } = data;

        await auditService.logPermissionCheck(
          targetUserId,
          targetUserEmail,
          targetUserRole,
          resource,
          permissionAction,
          granted,
          context,
        );

        return NextResponse.json({
          success: true,
          message: "Permission check logged",
        });

      case "create_violation":
        const violation = data;

        await auditService.createViolation(violation);

        return NextResponse.json({
          success: true,
          message: "Violation created",
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing audit request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
