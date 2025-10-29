// import { db } from "@/lib/db";
// import { queueService } from "./queue";
import { NotificationService } from "./notification-service";
// import { AuditService } from "./audit";
import * as fs from "fs/promises";
import * as path from "path";

// Mock db for now since the module is not available
const db = {
  organization: {
    findUnique: async (..._args: any[]) => ({ id: "mock-org", plan: "pro" }),
    findMany: async (..._args: any[]) => [{ id: "mock-org-1" }, { id: "mock-org-2" }],
  },
  user: {
    count: async (..._args: any[]) => 10,
  },
  report: {
    count: async (..._args: any[]) => 5,
  },
  exportJob: {
    count: async (..._args: any[]) => 3,
    findMany: async (..._args: any[]) => [
      {
        id: "export-1",
        downloadUrl: "/exports/test-export.csv",
        size: 1024,
        filePath: "/exports/test-export.csv"
      }
    ],
  },
  document: {
    findMany: async (..._args: any[]) => [
      {
        id: "doc-1",
        filePath: "/documents/test-doc.pdf",
        size: 2048
      }
    ],
  },
  upload: {
    findMany: async (..._args: any[]) => [
      {
        id: "upload-1",
        filePath: "/uploads/test-upload.jpg",
        size: 4096
      }
    ],
  },
  organizationMember: {
    count: async (..._args: any[]) => 5,
  },
  auditLog: {
    findMany: async (..._args: any[]) => [
      {
        id: "log-1",
        action: "api_request",
        details: { responseTime: 150, error: null, loadTime: 200 },
        createdAt: new Date()
      }
    ],
    count: async (..._args: any[]) => 0,
    groupBy: async (..._args: any[]) => [
      { userId: "user-1" },
      { userId: "user-2" }
    ],
  },
  usageMetrics: {
    create: async (..._args: any[]) => ({ id: "mock-metrics" }),
    findFirst: async (..._args: any[]) => null,
    upsert: async (..._args: any[]) => ({ id: "mock-metrics" }),
  },
  usageAlert: {
    create: async (..._args: any[]) => ({ id: "mock-alert" }),
    findMany: async (..._args: any[]) => [],
    update: async (..._args: any[]) => ({ id: "mock-alert" }),
  },
};

export interface UsageMetrics {
  organizationId: string;
  period: Date;
  storage: {
    totalBytes: number;
    documentsBytes: number;
    exportsBytes: number;
    uploadsBytes: number;
    tempBytes: number;
  };
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };
  reports: {
    totalReports: number;
    reportsGenerated: number;
    exportsCreated: number;
  };
  performance: {
    averageLoadTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface UsageLimits {
  organizationId: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  limits: {
    storage: number; // bytes
    users: number;
    reports: number;
    apiRequests: number; // per month
    exports: number; // per month
  };
  overageAllowed: boolean;
  overageRate?: number; // cost per unit over limit
}

export interface UsageAlert {
  id: string;
  organizationId: string;
  type: "storage" | "users" | "api_requests" | "reports" | "exports";
  severity: "warning" | "critical" | "exceeded";
  threshold: number; // percentage of limit
  currentUsage: number;
  limit: number;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export class UsageTrackingService {
  /**
   * Track real-time storage usage for an organization
   */
  static async calculateStorageUsage(
    organizationId: string,
  ): Promise<UsageMetrics["storage"]> {
    try {
      const storage = {
        totalBytes: 0,
        documentsBytes: 0,
        exportsBytes: 0,
        uploadsBytes: 0,
        tempBytes: 0,
      };

      // Calculate documents storage
      const documents = await db.document.findMany({
        where: { organizationId },
        select: { filePath: true, size: true },
      });

      for (const doc of documents) {
        if (doc.size) {
          storage.documentsBytes += doc.size;
        } else if (doc.filePath) {
          try {
            const stats = await fs.stat(
              path.join(process.cwd(), "public", doc.filePath),
            );
            storage.documentsBytes += stats.size;
          } catch (error) {
            console.warn(
              `Could not get size for document ${doc.filePath}:`,
              error,
            );
          }
        }
      }

      // Calculate exports storage
      const exports = await db.exportJob.findMany({
        where: {
          organizationId,
          status: "COMPLETED",
          downloadUrl: { not: null },
        },
        select: { downloadUrl: true },
      });

      for (const exportJob of exports) {
        if (exportJob.downloadUrl) {
          try {
            const stats = await fs.stat(
              path.join(process.cwd(), "public", exportJob.downloadUrl),
            );
            storage.exportsBytes += stats.size;
          } catch (error) {
            console.warn(
              `Could not get size for export ${exportJob.downloadUrl}:`,
              error,
            );
          }
        }
      }

      // Calculate uploads storage (user avatars, organization logos, etc.)
      const uploads = await db.upload.findMany({
        where: { organizationId },
        select: { filePath: true, size: true },
      });

      for (const upload of uploads) {
        if (upload.size) {
          storage.uploadsBytes += upload.size;
        } else if (upload.filePath) {
          try {
            const stats = await fs.stat(
              path.join(process.cwd(), "public", upload.filePath),
            );
            storage.uploadsBytes += stats.size;
          } catch (error) {
            console.warn(
              `Could not get size for upload ${upload.filePath}:`,
              error,
            );
          }
        }
      }

      // Calculate temp files storage
      try {
        const tempDir = path.join(process.cwd(), "temp");
        const tempFiles = await fs.readdir(tempDir);

        for (const file of tempFiles) {
          try {
            const stats = await fs.stat(path.join(tempDir, file));
            storage.tempBytes += stats.size;
          } catch (error) {
            // File might have been deleted, ignore
          }
        }
      } catch (error) {
        // Temp directory might not exist
      }

      storage.totalBytes =
        storage.documentsBytes +
        storage.exportsBytes +
        storage.uploadsBytes +
        storage.tempBytes;

      return storage;
    } catch (error) {
      console.error("Error calculating storage usage:", error);
      throw error;
    }
  }

  /**
   * Track API usage metrics
   */
  static async calculateApiUsage(
    organizationId: string,
    period: Date,
  ): Promise<UsageMetrics["api"]> {
    try {
      const startOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth(),
        1,
      );
      const endOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth() + 1,
        0,
      );

      // Get API usage from audit logs
      const apiLogs = await db.auditLog.findMany({
        where: {
          organizationId,
          action: { startsWith: "api_" },
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod,
          },
        },
        select: {
          action: true,
          details: true,
          createdAt: true,
        },
      });

      const totalRequests = apiLogs.length;
      const successfulRequests = apiLogs.filter(
        (log) => !log.details?.error && !log.action.includes("error"),
      ).length;
      const failedRequests = totalRequests - successfulRequests;

      // Calculate average response time from details
      const responseTimes = apiLogs
        .map((log) => log.details?.responseTime)
        .filter((time) => typeof time === "number") as number[];

      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0;

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
      };
    } catch (error) {
      console.error("Error calculating API usage:", error);
      throw error;
    }
  }

  /**
   * Track user metrics
   */
  static async calculateUserMetrics(
    organizationId: string,
    period: Date,
  ): Promise<UsageMetrics["users"]> {
    try {
      const startOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth(),
        1,
      );
      const endOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth() + 1,
        0,
      );

      // Total users in organization
      const totalUsers = await db.organizationMember.count({
        where: { organizationId },
      });

      // Active users (logged in during period)
      const activeUsers = await db.auditLog.groupBy({
        by: ["userId"],
        where: {
          organizationId,
          action: "user_login",
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod,
          },
        },
      });

      // New users (joined during period)
      const newUsers = await db.organizationMember.count({
        where: {
          organizationId,
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod,
          },
        },
      });

      return {
        totalUsers,
        activeUsers: activeUsers.length,
        newUsers,
      };
    } catch (error) {
      console.error("Error calculating user metrics:", error);
      throw error;
    }
  }

  /**
   * Track report metrics
   */
  static async calculateReportMetrics(
    organizationId: string,
    period: Date,
  ): Promise<UsageMetrics["reports"]> {
    try {
      const startOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth(),
        1,
      );
      const endOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth() + 1,
        0,
      );

      // Total reports
      const totalReports = await db.report.count({
        where: { organizationId },
      });

      // Reports generated during period
      const reportsGenerated = await db.report.count({
        where: {
          organizationId,
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod,
          },
        },
      });

      // Exports created during period
      const exportsCreated = await db.exportJob.count({
        where: {
          organizationId,
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod,
          },
        },
      });

      return {
        totalReports,
        reportsGenerated,
        exportsCreated,
      };
    } catch (error) {
      console.error("Error calculating report metrics:", error);
      throw error;
    }
  }

  /**
   * Calculate performance metrics
   */
  static async calculatePerformanceMetrics(
    organizationId: string,
    period: Date,
  ): Promise<UsageMetrics["performance"]> {
    try {
      const startOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth(),
        1,
      );
      const endOfPeriod = new Date(
        period.getFullYear(),
        period.getMonth() + 1,
        0,
      );

      // Get performance data from audit logs
      const performanceLogs = await db.auditLog.findMany({
        where: {
          organizationId,
          action: { in: ["page_load", "api_request", "error"] },
          createdAt: {
            gte: startOfPeriod,
            lte: endOfPeriod,
          },
        },
        select: {
          action: true,
          details: true,
        },
      });

      // Calculate average load time
      const loadTimes = performanceLogs
        .filter((log) => log.action === "page_load")
        .map((log) => log.details?.loadTime)
        .filter((time) => typeof time === "number") as number[];

      const averageLoadTime =
        loadTimes.length > 0
          ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
          : 0;

      // Calculate error rate
      const totalRequests = performanceLogs.filter(
        (log) => log.action === "page_load" || log.action === "api_request",
      ).length;
      const errors = performanceLogs.filter(
        (log) => log.action === "error",
      ).length;
      const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

      // Calculate uptime (simplified - in reality this would come from monitoring)
      const uptime = 99.9; // Mock uptime percentage

      return {
        averageLoadTime,
        errorRate,
        uptime,
      };
    } catch (error) {
      console.error("Error calculating performance metrics:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive usage metrics for an organization
   */
  static async getUsageMetrics(
    organizationId: string,
    period?: Date,
  ): Promise<UsageMetrics> {
    const targetPeriod = period || new Date();

    try {
      const [storage, api, users, reports, performance] = await Promise.all([
        this.calculateStorageUsage(organizationId),
        this.calculateApiUsage(organizationId, targetPeriod),
        this.calculateUserMetrics(organizationId, targetPeriod),
        this.calculateReportMetrics(organizationId, targetPeriod),
        this.calculatePerformanceMetrics(organizationId, targetPeriod),
      ]);

      const metrics: UsageMetrics = {
        organizationId,
        period: targetPeriod,
        storage,
        api,
        users,
        reports,
        performance,
      };

      // Store metrics in database for historical tracking
      await db.usageMetrics.upsert({
        where: {
          organizationId_period: {
            organizationId,
            period: new Date(
              targetPeriod.getFullYear(),
              targetPeriod.getMonth(),
              1,
            ),
          },
        },
        update: {
          metrics: JSON.stringify(metrics),
          updatedAt: new Date(),
        },
        create: {
          organizationId,
          period: new Date(
            targetPeriod.getFullYear(),
            targetPeriod.getMonth(),
            1,
          ),
          metrics: JSON.stringify(metrics),
        },
      });

      return metrics;
    } catch (error) {
      console.error("Error getting usage metrics:", error);
      throw error;
    }
  }

  /**
   * Get usage limits for an organization
   */
  static async getUsageLimits(organizationId: string): Promise<UsageLimits> {
    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true, settings: true },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Define limits based on plan
      const planLimits = {
        free: {
          storage: 1024 * 1024 * 1024, // 1GB
          users: 3,
          reports: 10,
          apiRequests: 1000,
          exports: 50,
        },
        basic: {
          storage: 10 * 1024 * 1024 * 1024, // 10GB
          users: 10,
          reports: 100,
          apiRequests: 10000,
          exports: 500,
        },
        pro: {
          storage: 100 * 1024 * 1024 * 1024, // 100GB
          users: 50,
          reports: 1000,
          apiRequests: 100000,
          exports: 5000,
        },
        enterprise: {
          storage: 1024 * 1024 * 1024 * 1024, // 1TB
          users: -1, // unlimited
          reports: -1, // unlimited
          apiRequests: -1, // unlimited
          exports: -1, // unlimited
        },
      };

      const plan = (organization.plan as keyof typeof planLimits) || "free";
      const limits = planLimits[plan];

      return {
        organizationId,
        plan,
        limits,
        overageAllowed: plan !== "free",
        overageRate: plan === "basic" ? 0.1 : plan === "pro" ? 0.05 : 0.02,
      };
    } catch (error) {
      console.error("Error getting usage limits:", error);
      throw error;
    }
  }

  /**
   * Check usage against limits and generate alerts
   */
  static async checkUsageAlerts(organizationId: string): Promise<UsageAlert[]> {
    try {
      const [metrics, limits] = await Promise.all([
        this.getUsageMetrics(organizationId),
        this.getUsageLimits(organizationId),
      ]);

      const alerts: UsageAlert[] = [];

      // Check storage usage
      if (limits.limits.storage > 0) {
        const storageUsage =
          (metrics.storage.totalBytes / limits.limits.storage) * 100;
        if (storageUsage >= 90) {
          alerts.push({
            id: `storage-${organizationId}-${Date.now()}`,
            organizationId,
            type: "storage",
            severity: storageUsage >= 100 ? "exceeded" : "critical",
            threshold: storageUsage >= 100 ? 100 : 90,
            currentUsage: metrics.storage.totalBytes,
            limit: limits.limits.storage,
            message: `Storage usage is at ${storageUsage.toFixed(1)}% of limit`,
            createdAt: new Date(),
            acknowledged: false,
          });
        } else if (storageUsage >= 75) {
          alerts.push({
            id: `storage-${organizationId}-${Date.now()}`,
            organizationId,
            type: "storage",
            severity: "warning",
            threshold: 75,
            currentUsage: metrics.storage.totalBytes,
            limit: limits.limits.storage,
            message: `Storage usage is at ${storageUsage.toFixed(1)}% of limit`,
            createdAt: new Date(),
            acknowledged: false,
          });
        }
      }

      // Check user limits
      if (limits.limits.users > 0) {
        const userUsage =
          (metrics.users.totalUsers / limits.limits.users) * 100;
        if (userUsage >= 90) {
          alerts.push({
            id: `users-${organizationId}-${Date.now()}`,
            organizationId,
            type: "users",
            severity: userUsage >= 100 ? "exceeded" : "critical",
            threshold: userUsage >= 100 ? 100 : 90,
            currentUsage: metrics.users.totalUsers,
            limit: limits.limits.users,
            message: `User count is at ${userUsage.toFixed(1)}% of limit`,
            createdAt: new Date(),
            acknowledged: false,
          });
        }
      }

      // Check API request limits
      if (limits.limits.apiRequests > 0) {
        const apiUsage =
          (metrics.api.totalRequests / limits.limits.apiRequests) * 100;
        if (apiUsage >= 90) {
          alerts.push({
            id: `api-${organizationId}-${Date.now()}`,
            organizationId,
            type: "api_requests",
            severity: apiUsage >= 100 ? "exceeded" : "critical",
            threshold: apiUsage >= 100 ? 100 : 90,
            currentUsage: metrics.api.totalRequests,
            limit: limits.limits.apiRequests,
            message: `API requests are at ${apiUsage.toFixed(1)}% of monthly limit`,
            createdAt: new Date(),
            acknowledged: false,
          });
        }
      }

      // Check export limits
      if (limits.limits.exports > 0) {
        const exportUsage =
          (metrics.reports.exportsCreated / limits.limits.exports) * 100;
        if (exportUsage >= 90) {
          alerts.push({
            id: `exports-${organizationId}-${Date.now()}`,
            organizationId,
            type: "exports",
            severity: exportUsage >= 100 ? "exceeded" : "critical",
            threshold: exportUsage >= 100 ? 100 : 90,
            currentUsage: metrics.reports.exportsCreated,
            limit: limits.limits.exports,
            message: `Exports are at ${exportUsage.toFixed(1)}% of monthly limit`,
            createdAt: new Date(),
            acknowledged: false,
          });
        }
      }

      // Store alerts in database
      for (const alert of alerts) {
        await db.usageAlert.create({
          data: {
            id: alert.id,
            organizationId: alert.organizationId,
            type: alert.type,
            severity: alert.severity,
            threshold: alert.threshold,
            currentUsage: alert.currentUsage,
            limit: alert.limit,
            message: alert.message,
            acknowledged: false,
          },
        });

        // Send notification for critical and exceeded alerts
        if (alert.severity === "critical" || alert.severity === "exceeded") {
          await NotificationService.sendUsageAlert(organizationId, {
            organizationName: "", // Will be filled by NotificationService
            alertType: alert.type,
            type: alert.type,
            severity: alert.severity,
            currentUsage: alert.currentUsage,
            limit: alert.limit,
            percentage: (alert.currentUsage / alert.limit) * 100,
            message: alert.message,
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error("Error checking usage alerts:", error);
      throw error;
    }
  }

  /**
   * Schedule periodic usage tracking jobs
   */
  static async scheduleUsageTracking(): Promise<void> {
    try {
      // Schedule hourly usage tracking for all organizations
      await QueueService.addRecurringJob(
        "usage-tracking",
        "track-hourly-usage",
        {},
        "0 * * * *", // Every hour
      );

      // Schedule daily usage alerts check
      await QueueService.addRecurringJob(
        "usage-tracking",
        "check-usage-alerts",
        {},
        "0 9 * * *", // Every day at 9 AM
      );

      // Schedule monthly usage reports
      await QueueService.addRecurringJob(
        "usage-tracking",
        "generate-monthly-reports",
        {},
        "0 0 1 * *", // First day of every month
      );

      console.log("Usage tracking jobs scheduled successfully");
    } catch (error) {
      console.error("Error scheduling usage tracking jobs:", error);
      throw error;
    }
  }

  /**
   * Process hourly usage tracking for all organizations
   */
  static async processHourlyUsageTracking(): Promise<void> {
    try {
      const organizations = await db.organization.findMany({
        select: { id: true },
      });

      for (const org of organizations) {
        try {
          await this.getUsageMetrics(org.id);
          console.log(`Updated usage metrics for organization ${org.id}`);
        } catch (error) {
          console.error(
            `Error updating usage metrics for organization ${org.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error("Error processing hourly usage tracking:", error);
      throw error;
    }
  }

  /**
   * Process daily usage alerts check for all organizations
   */
  static async processDailyUsageAlerts(): Promise<void> {
    try {
      const organizations = await db.organization.findMany({
        select: { id: true },
      });

      for (const org of organizations) {
        try {
          await this.checkUsageAlerts(org.id);
          console.log(`Checked usage alerts for organization ${org.id}`);
        } catch (error) {
          console.error(
            `Error checking usage alerts for organization ${org.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error("Error processing daily usage alerts:", error);
      throw error;
    }
  }

  /**
   * Clean up old temporary files to free storage
   */
  static async cleanupTempFiles(): Promise<number> {
    try {
      const tempDir = path.join(process.cwd(), "temp");
      let cleanedBytes = 0;

      try {
        const files = await fs.readdir(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const file of files) {
          const filePath = path.join(tempDir, file);
          try {
            const stats = await fs.stat(filePath);
            if (now - stats.mtime.getTime() > maxAge) {
              cleanedBytes += stats.size;
              await fs.unlink(filePath);
            }
          } catch (error) {
            // File might have been deleted, ignore
          }
        }
      } catch (error) {
        // Temp directory might not exist
      }

      console.log(`Cleaned up ${cleanedBytes} bytes of temporary files`);
      return cleanedBytes;
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
      throw error;
    }
  }
}

// Mock QueueService for now since the module is not available
const QueueService = {
  addRecurringJob: async (queue: string, jobName: string, _data: any, schedule: string) => {
    console.log(`Mock: Scheduled job ${jobName} in queue ${queue} with schedule ${schedule}`);
    return { id: `mock-job-${Date.now()}` };
  }
};
