/**
 * API Health Check Endpoint
 *
 * Proporciona información de salud del sistema:
 * - Estado de la aplicación
 * - Conectividad de base de datos
 * - Métricas de performance
 * - Estado de servicios externos
 */

import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    redis?: ServiceStatus;
    storage?: ServiceStatus;
  };
  metrics: {
    memory: MemoryMetrics;
    cpu?: number;
    requests?: RequestMetrics;
  };
}

interface ServiceStatus {
  status: "connected" | "disconnected" | "error";
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

interface RequestMetrics {
  total: number;
  perSecond: number;
  averageResponseTime: number;
  errorRate: number;
}

async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    return {
      status: "connected",
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

async function checkRedisHealth(): Promise<ServiceStatus> {
  // Mock Redis check - implement actual Redis connection if available
  return {
    status: "connected",
    responseTime: 5,
    lastCheck: new Date().toISOString(),
  };
}

function getMemoryMetrics(): MemoryMetrics {
  const memoryUsage = process.memoryUsage();

  return {
    used: memoryUsage.heapUsed,
    total: memoryUsage.heapTotal,
    percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
  };
}

function getSystemMetrics() {
  return {
    memory: getMemoryMetrics(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

function determineOverallStatus(
  services: HealthStatus["services"],
): HealthStatus["status"] {
  const serviceStatuses = Object.values(services).map(
    (service) => service.status,
  );

  if (serviceStatuses.every((status) => status === "connected")) {
    return "healthy";
  }

  if (serviceStatuses.some((status) => status === "error")) {
    return "unhealthy";
  }

  return "degraded";
}

export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now();

    // Check all services
    const [databaseStatus, redisStatus] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    const services = {
      database: databaseStatus,
      redis: redisStatus,
    };

    const systemMetrics = getSystemMetrics();
    const overallStatus = determineOverallStatus(services);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: systemMetrics.uptime,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services,
      metrics: {
        memory: systemMetrics.memory,
        requests: {
          total: 0, // Implement request counter if needed
          perSecond: 0,
          averageResponseTime: Date.now() - startTime,
          errorRate: 0,
        },
      },
    };

    // Set appropriate HTTP status based on health
    const httpStatus =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    return NextResponse.json(healthStatus, { status: httpStatus });
  } catch (error) {
    console.error("Health check failed:", error);

    const errorResponse: HealthStatus = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: {
          status: "error",
          lastCheck: new Date().toISOString(),
          error: "Health check failed",
        },
      },
      metrics: {
        memory: getMemoryMetrics(),
      },
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

// Detailed health check with more comprehensive tests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const includeDetailed = body.detailed || false;

    if (!includeDetailed) {
      return GET(request);
    }

    // Perform more comprehensive health checks
    const startTime = Date.now();

    // Test database operations
    const dbTests = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      // Add more database tests as needed
    ]);

    const databaseStatus: ServiceStatus = {
      status: dbTests.every((test) => test.status === "fulfilled")
        ? "connected"
        : "error",
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: dbTests.find((test) => test.status === "rejected")?.reason
        ?.message,
    };

    const detailedHealth = {
      status: databaseStatus.status === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      services: {
        database: databaseStatus,
      },
      metrics: getSystemMetrics(),
      tests: {
        database: dbTests.map((test, index) => ({
          name: `db_test_${index}`,
          status: test.status,
          error: test.status === "rejected" ? test.reason?.message : undefined,
        })),
      },
    };

    return NextResponse.json(detailedHealth, {
      status: detailedHealth.status === "healthy" ? 200 : 503,
    });
  } catch (error) {
    console.error("Detailed health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Detailed health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
