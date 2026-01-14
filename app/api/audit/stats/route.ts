import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DIContainer } from "@/shared/infrastructure/di/container";
import { AuditApiController } from "@/slices/audit/presentation/api/audit-api.controller";
import { TYPES } from "@/shared/infrastructure/di/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/audit/stats - Get audit log statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const controller = DIContainer.get<AuditApiController>(TYPES.AuditApiController);
    return controller.getAuditStats(request);
  } catch (error) {
    console.error("Failed to get audit stats:", error);
    return Response.json(
      { error: "Failed to get audit stats" },
      { status: 500 }
    );
  }
}
