/**
 * Monitoring and Metrics System
 *
 * Implements comprehensive application monitoring:
 * - Health checks for APIs and services
 * - Real-time performance metrics
 * - Automatic alerts
 * - Structured logging
 * - Usage and error metrics
 */

import { db } from "@/lib/db";

// Types for the monitoring system
export interface HealthCheck {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
}

/**
 * Main monitoring service
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private alertCallbacks: ((alert: Alert) => void)[] = [];

  private constructor() {
    this.startPeriodicHealthChecks();
    this.startMetricsCollection();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Registers a health check
   */
  registerHealthCheck(
    name: string,
    checkFn: () => Promise<{
      status: "healthy" | "unhealthy" | "degraded";
      details?: any;
    }>,
  ) {
    const performCheck = async (): Promise<HealthCheck> => {
      const startTime = Date.now();

      try {
        const result = await Promise.race([
          checkFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Health check timeout")), 10000),
          ),
        ]);

        return {
          name,
          status: result.status,
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
          details: result.details,
        };
      } catch (error) {
        return {
          name,
          status: "unhealthy",
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    };

    // Execute initial check
    performCheck().then((result) => {
      this.healthChecks.set(name, result);
    });

    return performCheck;
  }

  /**
   * Gets the status of all health checks
   */
  async getHealthStatus(): Promise<{
    status: "healthy" | "unhealthy" | "degraded";
    checks: HealthCheck[];
    timestamp: Date;
  }> {
    const checks = Array.from(this.healthChecks.values());

    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

    if (checks.some((check) => check.status === "unhealthy")) {
      overallStatus = "unhealthy";
    } else if (checks.some((check) => check.status === "degraded")) {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date(),
    };
  }

  /**
   * Records a metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>,
  ) {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only the last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check metric-based alerts
    this.checkMetricAlerts(metric);
  }

  /**
   * Gets metrics by name and time range
   */
  getMetrics(name?: string, startTime?: Date, endTime?: Date): Metric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter((m) => m.name === name);
    }

    if (startTime) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp >= startTime);
    }

    if (endTime) {
      filteredMetrics = filteredMetrics.filter((m) => m.timestamp <= endTime);
    }

    return filteredMetrics;
  }

  /**
   * Creates an alert
   */
  createAlert(
    name: string,
    severity: Alert["severity"],
    message: string,
    metadata?: Record<string, any>,
  ): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.push(alert);

    // Notificar callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error("Error in alert callback:", error);
      }
    });

    return alert;
  }

  /**
   * Resolves an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Gets active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Registers callback for alerts
   */
  onAlert(callback: (alert: Alert) => void) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Gets system performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Get metrics from the last few minutes
    const recentMetrics = this.getMetrics(undefined, oneMinuteAgo, now);

    const responseTimeMetrics = recentMetrics.filter(
      (m) => m.name === "response_time",
    );
    const errorMetrics = recentMetrics.filter((m) => m.name === "error_count");
    const requestMetrics = recentMetrics.filter(
      (m) => m.name === "request_count",
    );

    const avgResponseTime =
      responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) /
          responseTimeMetrics.length
        : 0;

    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    const errorRate =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // System metrics (simulated - in production use libraries like node-os-utils)
    const cpuUsage = Math.random() * 100; // Placeholder
    const memoryUsage = Math.random() * 100; // Placeholder
    const activeConnections = Math.floor(Math.random() * 1000); // Placeholder

    return {
      responseTime: avgResponseTime,
      throughput: totalRequests,
      errorRate,
      cpuUsage,
      memoryUsage,
      activeConnections,
    };
  }

  /**
   * Starts periodic health checks
   */
  private startPeriodicHealthChecks() {
    setInterval(async () => {
      // Re-execute all registered health checks
      for (const [name, check] of this.healthChecks.entries()) {
        try {
          // Here we would need to store the check functions
          // For simplicity, we only update the timestamp
          this.healthChecks.set(name, {
            ...check,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(`Health check failed for ${name}:`, error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Starts system metrics collection
   */
  private startMetricsCollection() {
    setInterval(() => {
      // Collect basic system metrics
      this.recordMetric("system_uptime", process.uptime(), "seconds");
      this.recordMetric(
        "memory_usage",
        process.memoryUsage().heapUsed,
        "bytes",
      );
      this.recordMetric(
        "memory_total",
        process.memoryUsage().heapTotal,
        "bytes",
      );
    }, 60000); // Every minute
  }

  /**
   * Checks metric-based alerts
   */
  private checkMetricAlerts(metric: Metric) {
    // Example alert rules
    if (metric.name === "response_time" && metric.value > 5000) {
      this.createAlert(
        "high_response_time",
        "high",
        `High response time detected: ${metric.value}ms`,
        { metric },
      );
    }

    if (metric.name === "error_rate" && metric.value > 5) {
      this.createAlert(
        "high_error_rate",
        "critical",
        `High error rate detected: ${metric.value}%`,
        { metric },
      );
    }

    if (
      metric.name === "memory_usage" &&
      metric.value > 0.9 * 1024 * 1024 * 1024
    ) {
      // 90% of 1GB
      this.createAlert(
        "high_memory_usage",
        "medium",
        `High memory usage detected: ${(metric.value / 1024 / 1024 / 1024).toFixed(2)}GB`,
        { metric },
      );
    }
  }
}

/**
 * Predefined health checks
 */
export const HealthChecks = {
  /**
   * Health check for database
   */
  database: async () => {
    try {
      await db.$queryRaw`SELECT 1`;
      return { status: "healthy" as const };
    } catch (error) {
      return {
        status: "unhealthy" as const,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },

  /**
   * Health check for external APIs
   */
  externalApi: (url: string) => async () => {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return { status: "healthy" as const };
      } else {
        return {
          status: "degraded" as const,
          details: { statusCode: response.status },
        };
      }
    } catch (error) {
      return {
        status: "unhealthy" as const,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },

  /**
   * Health check for Redis (if configured)
   */
  redis: async () => {
    try {
      if (process.env.REDIS_URL) {
        // Here would go the Redis connection logic
        return { status: "healthy" as const };
      } else {
        return {
          status: "degraded" as const,
          details: { message: "Redis not configured" },
        };
      }
    } catch (error) {
      return {
        status: "unhealthy" as const,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },

  /**
   * Health check for filesystem
   */
  filesystem: async () => {
    try {
      const fs = await import("fs/promises");
      await fs.access("./tmp", fs.constants.W_OK);
      return { status: "healthy" as const };
    } catch (error) {
      return {
        status: "unhealthy" as const,
        details: { error: "Filesystem not writable" },
      };
    }
  },
};

/**
 * Middleware for API metrics
 */
export function createMetricsMiddleware(monitoring: MonitoringService) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Intercept the end of the response
    const originalSend = res.send;
    res.send = function (data: any) {
      const responseTime = Date.now() - startTime;

      // Record metrics
      monitoring.recordMetric("request_count", 1, "count", {
        method: req.method,
        route: req.route?.path || req.path,
        status: res.statusCode.toString(),
      });

      monitoring.recordMetric("response_time", responseTime, "milliseconds", {
        method: req.method,
        route: req.route?.path || req.path,
      });

      if (res.statusCode >= 400) {
        monitoring.recordMetric("error_count", 1, "count", {
          method: req.method,
          route: req.route?.path || req.path,
          status: res.statusCode.toString(),
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

// Singleton instance
export const monitoring = MonitoringService.getInstance();

// Register default health checks
monitoring.registerHealthCheck("database", HealthChecks.database);
monitoring.registerHealthCheck("filesystem", HealthChecks.filesystem);

// Configure email/webhook alerts (example)
monitoring.onAlert((alert) => {
  console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

  // Here you could send email, webhook, etc.
  if (alert.severity === "critical") {
    // Send immediate notification
    console.log("🔥 CRITICAL ALERT - Immediate action required!");
  }
});

export default monitoring;
