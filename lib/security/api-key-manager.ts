import { NextRequest } from "next/server";
import { ApiKey, ApiKeyPermission, ApiKeyUsage } from "@/lib/types/security";
import { logUnauthorizedAccess } from "./security-monitor";

interface ApiKeyStore {
  [keyId: string]: ApiKey;
}

interface ApiKeyUsageStore {
  [keyId: string]: ApiKeyUsage[];
}

class ApiKeyManager {
  private keys: ApiKeyStore = {};
  private usage: ApiKeyUsageStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old usage records every hour
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupUsageRecords();
      },
      60 * 60 * 1000,
    );
  }

  private cleanupUsageRecords() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days of usage

    Object.keys(this.usage).forEach((keyId) => {
      this.usage[keyId] = this.usage[keyId].filter(
        (usage) => usage.timestamp > cutoffDate,
      );
    });
  }

  private generateKeyId(): string {
    return `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSecretKey(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "sk_";
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createApiKey(
    name: string,
    organizationId: string,
    permissions: ApiKeyPermission[],
    expiresAt?: Date,
    rateLimit?: { requests: number; windowMs: number },
  ): Promise<{ apiKey: ApiKey; secretKey: string }> {
    const keyId = this.generateKeyId();
    const secretKey = this.generateSecretKey();

    const apiKey: ApiKey = {
      id: keyId,
      name,
      organizationId,
      keyHash: await this.hashKey(secretKey), // In production, use proper hashing
      permissions,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: null,
      expiresAt: expiresAt || null,
      rateLimit: rateLimit || { requests: 1000, windowMs: 60 * 60 * 1000 }, // Default: 1000/hour
      usageCount: 0,
    };

    this.keys[keyId] = apiKey;
    this.usage[keyId] = [];

    return { apiKey, secretKey };
  }

  private async hashKey(key: string): Promise<string> {
    // In production, use a proper hashing algorithm like bcrypt or argon2
    // For demo purposes, using a simple hash
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async validateApiKey(
    secretKey: string,
    requiredPermission?: ApiKeyPermission,
  ): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
    const keyHash = await this.hashKey(secretKey);

    // Find the API key by hash
    const apiKey = Object.values(this.keys).find(
      (key) => key.keyHash === keyHash,
    );

    if (!apiKey) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return { valid: false, error: "API key is inactive" };
    }

    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Check permissions if required
    if (
      requiredPermission &&
      !apiKey.permissions.includes(requiredPermission)
    ) {
      return { valid: false, error: "Insufficient permissions" };
    }

    return { valid: true, apiKey };
  }

  async recordUsage(
    apiKey: ApiKey,
    req: NextRequest,
    endpoint: string,
    responseStatus: number,
    responseTime: number,
  ): Promise<void> {
    const usage: ApiKeyUsage = {
      timestamp: new Date(),
      endpoint,
      method: req.method,
      ipAddress: this.extractIPAddress(req),
      userAgent: req.headers.get("user-agent") || "unknown",
      responseStatus,
      responseTime,
    };

    // Record usage
    if (!this.usage[apiKey.id]) {
      this.usage[apiKey.id] = [];
    }
    this.usage[apiKey.id].push(usage);

    // Update key usage count and last used
    this.keys[apiKey.id].usageCount++;
    this.keys[apiKey.id].lastUsedAt = new Date();
  }

  private extractIPAddress(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    return forwarded?.split(",")[0] || realIP || req.ip || "unknown";
  }

  async checkRateLimit(
    apiKey: ApiKey,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!apiKey.rateLimit) {
      return { allowed: true, remaining: Infinity, resetTime: 0 };
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - apiKey.rateLimit.windowMs);

    // Count requests in current window
    const recentUsage =
      this.usage[apiKey.id]?.filter((usage) => usage.timestamp > windowStart) ||
      [];

    const requestCount = recentUsage.length;
    const remaining = Math.max(0, apiKey.rateLimit.requests - requestCount);
    const resetTime = windowStart.getTime() + apiKey.rateLimit.windowMs;

    return {
      allowed: requestCount < apiKey.rateLimit.requests,
      remaining,
      resetTime,
    };
  }

  async getApiKeys(organizationId: string): Promise<ApiKey[]> {
    return Object.values(this.keys).filter(
      (key) => key.organizationId === organizationId,
    );
  }

  async getApiKey(keyId: string): Promise<ApiKey | null> {
    return this.keys[keyId] || null;
  }

  async updateApiKey(
    keyId: string,
    updates: Partial<
      Pick<
        ApiKey,
        "name" | "permissions" | "isActive" | "expiresAt" | "rateLimit"
      >
    >,
  ): Promise<boolean> {
    if (!this.keys[keyId]) {
      return false;
    }

    this.keys[keyId] = { ...this.keys[keyId], ...updates };
    return true;
  }

  async deleteApiKey(keyId: string): Promise<boolean> {
    if (!this.keys[keyId]) {
      return false;
    }

    delete this.keys[keyId];
    delete this.usage[keyId];
    return true;
  }

  async getUsageStats(
    keyId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    requestsByHour: Array<{ hour: string; count: number }>;
  }> {
    const usage =
      this.usage[keyId]?.filter(
        (u) => u.timestamp >= timeRange.start && u.timestamp <= timeRange.end,
      ) || [];

    const totalRequests = usage.length;
    const successfulRequests = usage.filter(
      (u) => u.responseStatus < 400,
    ).length;
    const failedRequests = totalRequests - successfulRequests;

    const averageResponseTime =
      usage.length > 0
        ? usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length
        : 0;

    // Count requests by endpoint
    const endpointCounts: Record<string, number> = {};
    usage.forEach((u) => {
      endpointCounts[u.endpoint] = (endpointCounts[u.endpoint] || 0) + 1;
    });

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Count requests by hour
    const hourCounts: Record<string, number> = {};
    usage.forEach((u) => {
      const hour = u.timestamp.toISOString().slice(0, 13) + ":00:00";
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const requestsByHour = Object.entries(hourCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      topEndpoints,
      requestsByHour,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
const apiKeyManager = new ApiKeyManager();

export { apiKeyManager };

// Middleware function for API key authentication
export async function createApiKeyMiddleware(
  requiredPermission?: ApiKeyPermission,
) {
  return async function apiKeyMiddleware(req: NextRequest): Promise<{
    valid: boolean;
    apiKey?: ApiKey;
    error?: string;
    rateLimitExceeded?: boolean;
  }> {
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");

    let secretKey: string | null = null;

    // Extract API key from Authorization header (Bearer token) or X-API-Key header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      secretKey = authHeader.substring(7);
    } else if (apiKeyHeader) {
      secretKey = apiKeyHeader;
    }

    if (!secretKey) {
      return { valid: false, error: "API key required" };
    }

    // Validate the API key
    const validation = await apiKeyManager.validateApiKey(
      secretKey,
      requiredPermission,
    );

    if (!validation.valid || !validation.apiKey) {
      await logUnauthorizedAccess(
        req,
        req.nextUrl.pathname,
        requiredPermission || "api_access",
      );
      return { valid: false, error: validation.error };
    }

    // Check rate limit
    const rateLimit = await apiKeyManager.checkRateLimit(validation.apiKey);

    if (!rateLimit.allowed) {
      return {
        valid: false,
        error: "Rate limit exceeded",
        rateLimitExceeded: true,
      };
    }

    return { valid: true, apiKey: validation.apiKey };
  };
}

// Helper function to extract API key from request
export function extractApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("x-api-key");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

// Predefined permission sets
export const API_PERMISSIONS = {
  READ_ONLY: [
    ApiKeyPermission.READ_ORGANIZATIONS,
    ApiKeyPermission.READ_USERS,
  ] as ApiKeyPermission[],
  FULL_ACCESS: Object.values(ApiKeyPermission) as ApiKeyPermission[],
  WEBHOOK_ACCESS: [ApiKeyPermission.WEBHOOK_ACCESS] as ApiKeyPermission[],
  ADMIN_ACCESS: [
    ApiKeyPermission.READ_ORGANIZATIONS,
    ApiKeyPermission.WRITE_ORGANIZATIONS,
    ApiKeyPermission.READ_USERS,
    ApiKeyPermission.WRITE_USERS,
    ApiKeyPermission.ADMIN_ACCESS,
  ] as ApiKeyPermission[],
};
