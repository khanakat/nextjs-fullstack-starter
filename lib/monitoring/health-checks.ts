import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

export interface HealthCheckResult {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  timestamp: Date;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  overall: "healthy" | "unhealthy" | "degraded";
  services: HealthCheckResult[];
  uptime: number;
  version: string;
  environment: string;
}

export class HealthCheckService {
  private prisma: PrismaClient;
  private redis?: Redis;
  private startTime: Date;

  constructor() {
    this.prisma = new PrismaClient();
    this.startTime = new Date();

    // Initialize Redis if available
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || "0"),
          connectTimeout: 5000,
          lazyConnect: true,
        });
      } catch (error) {
        console.warn("Redis health check initialization failed:", error);
      }
    }
  }

  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      return {
        service: "database",
        status: responseTime < 1000 ? "healthy" : "degraded",
        responseTime,
        timestamp: new Date(),
        details: {
          type: "postgresql",
          responseTimeMs: responseTime,
        },
      };
    } catch (error) {
      return {
        service: "database",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : "Unknown database error",
      };
    }
  }

  async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!this.redis) {
      return {
        service: "redis",
        status: "unhealthy",
        responseTime: 0,
        timestamp: new Date(),
        error: "Redis not configured",
      };
    }

    try {
      await this.redis.ping();

      const responseTime = Date.now() - startTime;

      return {
        service: "redis",
        status: responseTime < 500 ? "healthy" : "degraded",
        responseTime,
        timestamp: new Date(),
        details: {
          responseTimeMs: responseTime,
        },
      };
    } catch (error) {
      return {
        service: "redis",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown Redis error",
      };
    }
  }

  async checkMemory(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: "healthy" | "degraded" | "unhealthy" = "healthy";
      if (memoryUsagePercent > 90) {
        status = "unhealthy";
      } else if (memoryUsagePercent > 75) {
        status = "degraded";
      }

      return {
        service: "memory",
        status,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
          heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent * 100) / 100,
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        },
      };
    } catch (error) {
      return {
        service: "memory",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown memory error",
      };
    }
  }

  async checkDisk(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const fs = await import("fs/promises");

      // Check available disk space
      const stats = await fs.statfs(process.cwd());
      const totalSpace = stats.bavail * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100;

      let status: "healthy" | "degraded" | "unhealthy" = "healthy";
      if (usedPercent > 95) {
        status = "unhealthy";
      } else if (usedPercent > 85) {
        status = "degraded";
      }

      return {
        service: "disk",
        status,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          totalSpaceGB:
            Math.round((totalSpace / 1024 / 1024 / 1024) * 100) / 100,
          freeSpaceGB: Math.round((freeSpace / 1024 / 1024 / 1024) * 100) / 100,
          usedPercent: Math.round(usedPercent * 100) / 100,
        },
      };
    } catch (error) {
      return {
        service: "disk",
        status: "degraded", // Not critical for app functionality
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : "Disk check unavailable",
      };
    }
  }

  async checkExternalServices(): Promise<HealthCheckResult[]> {
    const checks: Promise<HealthCheckResult>[] = [];

    // Check external APIs if configured
    const externalServices: Array<{
      name: string;
      url?: string;
      headers?: Record<string, string>;
    }> = [
      {
        name: "stripe",
        url: "https://api.stripe.com/v1/account",
        headers: process.env.STRIPE_SECRET_KEY
          ? {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            }
          : undefined,
      },
      {
        name: "supabase",
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`
          : undefined,
        headers: process.env.SUPABASE_SERVICE_ROLE_KEY
          ? {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            }
          : undefined,
      },
    ];

    for (const service of externalServices) {
      if (service.url && service.headers) {
        checks.push(
          this.checkExternalService(service.name, service.url, service.headers),
        );
      }
    }

    return Promise.all(checks);
  }

  private async checkExternalService(
    name: string,
    url: string,
    headers: Record<string, string> | undefined,
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        method: "GET",
        headers: headers || {},
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        service: name,
        status: response.ok
          ? responseTime < 2000
            ? "healthy"
            : "degraded"
          : "unhealthy",
        responseTime,
        timestamp: new Date(),
        details: {
          statusCode: response.status,
          responseTimeMs: responseTime,
        },
      };
    } catch (error) {
      return {
        service: name,
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : "External service error",
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk(),
      ...(await this.checkExternalServices()),
    ]);

    // Determine overall health
    const unhealthyServices = checks.filter((c) => c.status === "unhealthy");
    const degradedServices = checks.filter((c) => c.status === "degraded");

    let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (unhealthyServices.length > 0) {
      // Critical services (database) being unhealthy makes system unhealthy
      const criticalUnhealthy = unhealthyServices.some((s) =>
        ["database"].includes(s.service),
      );
      overall = criticalUnhealthy ? "unhealthy" : "degraded";
    } else if (degradedServices.length > 0) {
      overall = "degraded";
    }

    return {
      overall,
      services: checks,
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

// Singleton instance
let healthCheckService: HealthCheckService;

export function getHealthCheckService(): HealthCheckService {
  if (!healthCheckService) {
    healthCheckService = new HealthCheckService();
  }
  return healthCheckService;
}
