import Redis from "ioredis";

// Redis client for rate limiting
let redis: Redis | null = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
} catch (error) {
  console.warn("Redis not available, using in-memory rate limiting");
}

// In-memory fallback for rate limiting
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting service with Redis backend and in-memory fallback
export class RateLimitService {
  // Check if request is within rate limit
  static async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    identifier?: string,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const fullKey = identifier
      ? `rate_limit:${identifier}:${key}`
      : `rate_limit:${key}`;

    if (redis) {
      return this.checkRateLimitRedis(fullKey, limit, windowMs);
    } else {
      return this.checkRateLimitMemory(fullKey, limit, windowMs);
    }
  }

  // Redis-based rate limiting
  private static async checkRateLimitRedis(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    try {
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const windowKey = `${key}:${window}`;

      // Use Redis pipeline for atomic operations
      const pipeline = redis!.pipeline();
      pipeline.incr(windowKey);
      pipeline.expire(windowKey, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();
      const count = (results?.[0]?.[1] as number) || 0;

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetTime = (window + 1) * windowMs;

      return {
        allowed,
        remaining,
        resetTime,
        totalHits: count,
      };
    } catch (error) {
      console.error("Redis rate limiting error:", error);
      // Fallback to memory-based rate limiting
      return this.checkRateLimitMemory(key, limit, windowMs);
    }
  }

  // Memory-based rate limiting fallback
  private static checkRateLimitMemory(
    key: string,
    limit: number,
    windowMs: number,
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  } {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;

    const existing = memoryStore.get(windowKey);
    const count = existing ? existing.count + 1 : 1;
    const resetTime = (window + 1) * windowMs;

    memoryStore.set(windowKey, { count, resetTime });

    // Clean up expired entries
    this.cleanupMemoryStore();

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      allowed,
      remaining,
      resetTime,
      totalHits: count,
    };
  }

  // Clean up expired entries from memory store
  private static cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetTime < now) {
        memoryStore.delete(key);
      }
    }
  }

  // API rate limiting with different tiers
  static async checkApiRateLimit(
    apiKey: string,
    endpoint: string,
    tier: "free" | "basic" | "premium" | "enterprise" = "free",
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
    tier: string;
  }> {
    const limits = this.getApiLimits(tier);
    const key = `api:${apiKey}:${endpoint}`;

    const result = await this.checkRateLimit(
      key,
      limits.requestsPerMinute,
      60 * 1000,
    );

    return {
      ...result,
      tier,
    };
  }

  // User-based rate limiting
  static async checkUserRateLimit(
    userId: string,
    action: string,
    customLimit?: { limit: number; windowMs: number },
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const limits = customLimit || this.getUserLimits(action);
    const key = `user:${userId}:${action}`;

    return this.checkRateLimit(key, limits.limit, limits.windowMs);
  }

  // IP-based rate limiting
  static async checkIpRateLimit(
    ip: string,
    endpoint: string,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const limits = this.getIpLimits(endpoint);
    const key = `ip:${ip}:${endpoint}`;

    return this.checkRateLimit(key, limits.limit, limits.windowMs);
  }

  // Organization-based rate limiting
  static async checkOrganizationRateLimit(
    organizationId: string,
    action: string,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const limits = this.getOrganizationLimits(action);
    const key = `org:${organizationId}:${action}`;

    return this.checkRateLimit(key, limits.limit, limits.windowMs);
  }

  // DDoS protection - detect and block suspicious patterns
  static async checkDDoSProtection(
    ip: string,
    _userAgent?: string,
  ): Promise<{
    blocked: boolean;
    reason?: string;
    blockDuration?: number;
  }> {
    // Check if IP is already blocked
    const blockKey = `ddos_block:${ip}`;
    const isBlocked = redis
      ? await redis.get(blockKey)
      : memoryStore.has(blockKey);

    if (isBlocked) {
      return {
        blocked: true,
        reason: "IP temporarily blocked due to suspicious activity",
        blockDuration: 3600000, // 1 hour
      };
    }

    // Check request patterns
    const patternKey = `ddos_pattern:${ip}`;
    const windowMs = 60000; // 1 minute
    const suspiciousThreshold = 100; // requests per minute

    const result = await this.checkRateLimit(
      patternKey,
      suspiciousThreshold,
      windowMs,
    );

    if (!result.allowed) {
      // Block the IP
      const blockDuration = 3600; // 1 hour in seconds

      if (redis) {
        await redis.setex(blockKey, blockDuration, "blocked");
      } else {
        memoryStore.set(blockKey, {
          count: 1,
          resetTime: Date.now() + blockDuration * 1000,
        });
      }

      return {
        blocked: true,
        reason: "DDoS protection triggered - too many requests",
        blockDuration: blockDuration * 1000,
      };
    }

    return { blocked: false };
  }

  // Get API limits based on tier
  private static getApiLimits(tier: string): {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  } {
    const limits = {
      free: {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000,
      },
      basic: {
        requestsPerMinute: 50,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      },
      premium: {
        requestsPerMinute: 200,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
      },
      enterprise: {
        requestsPerMinute: 1000,
        requestsPerHour: 25000,
        requestsPerDay: 250000,
      },
    };

    return limits[tier as keyof typeof limits] || limits.free;
  }

  // Get user limits based on action
  private static getUserLimits(action: string): {
    limit: number;
    windowMs: number;
  } {
    const limits: { [key: string]: { limit: number; windowMs: number } } = {
      login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      password_reset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
      mfa_verify: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
      api_call: { limit: 100, windowMs: 60 * 1000 }, // 100 calls per minute
      file_upload: { limit: 20, windowMs: 60 * 1000 }, // 20 uploads per minute
      data_export: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 exports per hour
      message_send: { limit: 50, windowMs: 60 * 1000 }, // 50 messages per minute
      default: { limit: 60, windowMs: 60 * 1000 }, // 60 requests per minute
    };

    return limits[action] || limits.default;
  }

  // Get IP limits based on endpoint
  private static getIpLimits(endpoint: string): {
    limit: number;
    windowMs: number;
  } {
    const limits: { [key: string]: { limit: number; windowMs: number } } = {
      "/api/auth/login": { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
      "/api/auth/register": { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 registrations per hour
      "/api/auth/forgot-password": { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
      "/api/contact": { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 contact forms per hour
      default: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
    };

    return limits[endpoint] || limits.default;
  }

  // Get organization limits based on action
  private static getOrganizationLimits(action: string): {
    limit: number;
    windowMs: number;
  } {
    const limits: { [key: string]: { limit: number; windowMs: number } } = {
      api_calls: { limit: 10000, windowMs: 60 * 60 * 1000 }, // 10k calls per hour
      file_uploads: { limit: 1000, windowMs: 60 * 60 * 1000 }, // 1k uploads per hour
      data_exports: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 exports per hour
      user_invites: { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 invites per hour
      default: { limit: 5000, windowMs: 60 * 60 * 1000 }, // 5k requests per hour
    };

    return limits[action] || limits.default;
  }

  // Block IP address
  static async blockIp(
    ip: string,
    reason: string,
    durationSeconds: number = 3600,
  ): Promise<boolean> {
    try {
      const blockKey = `ip_block:${ip}`;
      const blockData = JSON.stringify({
        reason,
        blockedAt: new Date().toISOString(),
        duration: durationSeconds,
      });

      if (redis) {
        await redis.setex(blockKey, durationSeconds, blockData);
      } else {
        memoryStore.set(blockKey, {
          count: 1,
          resetTime: Date.now() + durationSeconds * 1000,
        });
      }

      return true;
    } catch (error) {
      console.error("Error blocking IP:", error);
      return false;
    }
  }

  // Check if IP is blocked
  static async isIpBlocked(ip: string): Promise<{
    blocked: boolean;
    reason?: string;
    blockedAt?: string;
    expiresAt?: string;
  }> {
    try {
      const blockKey = `ip_block:${ip}`;

      if (redis) {
        const blockData = await redis.get(blockKey);
        if (blockData) {
          const data = JSON.parse(blockData);
          const ttl = await redis.ttl(blockKey);
          return {
            blocked: true,
            reason: data.reason,
            blockedAt: data.blockedAt,
            expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
          };
        }
      } else {
        const blockData = memoryStore.get(blockKey);
        if (blockData && blockData.resetTime > Date.now()) {
          return {
            blocked: true,
            reason: "IP blocked",
            expiresAt: new Date(blockData.resetTime).toISOString(),
          };
        }
      }

      return { blocked: false };
    } catch (error) {
      console.error("Error checking IP block status:", error);
      return { blocked: false };
    }
  }

  // Unblock IP address
  static async unblockIp(ip: string): Promise<boolean> {
    try {
      const blockKey = `ip_block:${ip}`;

      if (redis) {
        await redis.del(blockKey);
      } else {
        memoryStore.delete(blockKey);
      }

      return true;
    } catch (error) {
      console.error("Error unblocking IP:", error);
      return false;
    }
  }

  // Get rate limit statistics
  static async getRateLimitStats(
    key: string,
    windowMs: number = 60000,
  ): Promise<{
    currentWindow: number;
    previousWindow: number;
    trend: "increasing" | "decreasing" | "stable";
  }> {
    try {
      const now = Date.now();
      const currentWindow = Math.floor(now / windowMs);
      const previousWindow = currentWindow - 1;

      const currentKey = `${key}:${currentWindow}`;
      const previousKey = `${key}:${previousWindow}`;

      let currentCount = 0;
      let previousCount = 0;

      if (redis) {
        const [current, previous] = await Promise.all([
          redis.get(currentKey),
          redis.get(previousKey),
        ]);
        currentCount = parseInt(current || "0");
        previousCount = parseInt(previous || "0");
      } else {
        const currentData = memoryStore.get(currentKey);
        const previousData = memoryStore.get(previousKey);
        currentCount = currentData?.count || 0;
        previousCount = previousData?.count || 0;
      }

      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (currentCount > previousCount * 1.1) trend = "increasing";
      else if (currentCount < previousCount * 0.9) trend = "decreasing";

      return {
        currentWindow: currentCount,
        previousWindow: previousCount,
        trend,
      };
    } catch (error) {
      console.error("Error getting rate limit stats:", error);
      return {
        currentWindow: 0,
        previousWindow: 0,
        trend: "stable",
      };
    }
  }

  // Reset rate limit for a key
  static async resetRateLimit(key: string): Promise<boolean> {
    try {
      if (redis) {
        const keys = await redis.keys(`${key}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        for (const [memKey] of memoryStore.entries()) {
          if (memKey.startsWith(`${key}:`)) {
            memoryStore.delete(memKey);
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error resetting rate limit:", error);
      return false;
    }
  }
}

// Rate limiting middleware factory
export function createRateLimitMiddleware(options: {
  keyGenerator?: (req: any) => string;
  limit?: number;
  windowMs?: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) {
  const {
    keyGenerator = (req: any) => req.ip || "unknown",
    limit = 100,
    windowMs = 60 * 1000,
    message = "Too many requests",
    statusCode = 429,
    headers = true,
  } = options;

  return async (req: any, res: any, next: any) => {
    try {
      const key = keyGenerator(req);
      const result = await RateLimitService.checkRateLimit(
        key,
        limit,
        windowMs,
      );

      if (headers) {
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", result.remaining);
        res.setHeader(
          "X-RateLimit-Reset",
          new Date(result.resetTime).toISOString(),
        );
      }

      if (!result.allowed) {
        return res.status(statusCode).json({
          error: message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
      }

      next();
    } catch (error) {
      console.error("Rate limiting middleware error:", error);
      next(); // Continue on error to avoid blocking legitimate requests
    }
  };
}
