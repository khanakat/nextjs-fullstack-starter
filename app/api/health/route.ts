/**
 * API de Health Checks
 *
 * Endpoint para verificar el estado de salud de la aplicación
 * GET /api/health - Estado general
 * GET /api/health/detailed - Estado detallado con métricas
 */

import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "true";

    if (detailed) {
      // Estado detallado con métricas
      const [healthStatus, performanceMetrics, activeAlerts] =
        await Promise.all([
          monitoring.getHealthStatus(),
          monitoring.getPerformanceMetrics(),
          monitoring.getActiveAlerts(),
        ]);

      return NextResponse.json({
        status: healthStatus.status,
        timestamp: healthStatus.timestamp,
        checks: healthStatus.checks,
        performance: performanceMetrics,
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter((a) => a.severity === "critical")
            .length,
          high: activeAlerts.filter((a) => a.severity === "high").length,
          medium: activeAlerts.filter((a) => a.severity === "medium").length,
          low: activeAlerts.filter((a) => a.severity === "low").length,
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform,
        },
      });
    } else {
      // Estado básico
      const healthStatus = await monitoring.getHealthStatus();

      return NextResponse.json({
        status: healthStatus.status,
        timestamp: healthStatus.timestamp,
        uptime: process.uptime(),
      });
    }
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date(),
        error: "Health check failed",
      },
      { status: 500 },
    );
  }
}

export async function HEAD(_request: NextRequest) {
  try {
    const healthStatus = await monitoring.getHealthStatus();

    if (healthStatus.status === "healthy") {
      return new NextResponse(null, { status: 200 });
    } else if (healthStatus.status === "degraded") {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
