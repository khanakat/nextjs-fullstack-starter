import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

// In-memory cache for Edge Runtime
const memoryCache = new Map<string, RateLimitEntry>();

export class EdgeRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      ...config,
    };
  }

  private getClientIP(request: NextRequest): string {
    // Try to get real IP from various headers
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
      return realIP.trim();
    }

    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    if (cfConnectingIP) {
      return cfConnectingIP.trim();
    }

    return "unknown";
  }

  private getRateLimitKey(request: NextRequest): string {
    const baseKey = this.config.keyGenerator!(request);
    return `rate_limit:${baseKey}`;
  }

  async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
  }> {
    const key = this.getRateLimitKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get current request count for this window
    const requestsData = memoryCache.get(key);

    let count = 0;
    let resetTime = now + this.config.windowMs;
    let requests: number[] = [];

    if (requestsData) {
      // Filter requests within current window
      requests = requestsData.requests.filter(
        (timestamp) => timestamp > windowStart,
      );
      count = requests.length;
      resetTime = requestsData.resetTime;

      // If we're in a new window, reset
      if (now >= requestsData.resetTime) {
        count = 0;
        requests = [];
        resetTime = now + this.config.windowMs;
      }
    }

    const allowed = count < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - count);
    const retryAfter = allowed
      ? undefined
      : Math.ceil((resetTime - now) / 1000);

    // If request is allowed, increment counter
    if (allowed) {
      requests.push(now);
      memoryCache.set(key, {
        count: requests.length,
        resetTime,
        requests,
      });
    }

    return {
      allowed,
      info: {
        limit: this.config.maxRequests,
        remaining,
        resetTime: new Date(resetTime),
        retryAfter,
      },
    };
  }

  createMiddleware() {
    return async (request: NextRequest) => {
      const result = await this.checkRateLimit(request);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Too Many Requests",
            message: `Rate limit exceeded. Try again in ${result.info.retryAfter} seconds.`,
            retryAfter: result.info.retryAfter,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": result.info.limit.toString(),
              "X-RateLimit-Remaining": result.info.remaining.toString(),
              "X-RateLimit-Reset": result.info.resetTime.toISOString(),
              "Retry-After": result.info.retryAfter?.toString() || "60",
            },
          },
        );
      }

      return NextResponse.next();
    };
  }
}

// Edge-compatible rate limiters
export const edgeRateLimiters = {
  api: new EdgeRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  auth: new EdgeRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  upload: new EdgeRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  }),

  export: new EdgeRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  }),

  search: new EdgeRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  }),

  webhook: new EdgeRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (request) => {
      // For webhooks, use a combination of IP and user agent
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";
      return `${ip}:${userAgent}`;
    },
  }),
};

// Clean up old entries periodically (simple cleanup)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.resetTime) {
      memoryCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes