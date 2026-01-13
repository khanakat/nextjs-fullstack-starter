import { NextRequest, NextResponse } from "next/server";
import { getCacheService } from "@/lib/cache/cache-service";
import { apiKeyManager } from "@/lib/security/api-key-manager";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (request: NextRequest) => void;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class RateLimiter {
  private cache?: ReturnType<typeof getCacheService>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  private getCache() {
    if (!this.cache) {
      this.cache = getCacheService();
    }
    return this.cache;
  }

  private getClientIP(request: NextRequest): string {
    // Try to get real IP from various headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback to connection remote address
    return request.ip || "unknown";
  }

  private getRateLimitKey(request: NextRequest): string {
    const identifier = this.config.keyGenerator!(request);
    const pathname = new URL(request.url).pathname;
    return `rate_limit:${pathname}:${identifier}`;
  }

  async checkRateLimit(request: NextRequest): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
  }> {
    const key = this.getRateLimitKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get current request count for this window
    const cache = this.getCache();
    const requestsData = await cache.get<{
      count: number;
      resetTime: number;
      requests: number[];
    }>(key);

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
      await cache.set(
        key,
        {
          count: requests.length,
          resetTime,
          requests,
        },
        Math.ceil(this.config.windowMs / 1000),
      );
    } else {
      // Call limit reached callback
      this.config.onLimitReached?.(request);
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

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", result.info.limit.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        result.info.remaining.toString(),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        result.info.resetTime.toISOString(),
      );

      return response;
    };
  }
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  // Strict rate limiting for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    onLimitReached: (request) => {
      console.warn(`Auth rate limit exceeded for IP: ${request.ip}`);
    },
  }),

  // File upload rate limiting
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  }),

  // Export/report generation rate limiting
  export: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  }),

  // Search rate limiting
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  }),

  // Webhook rate limiting
  webhook: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (request) => {
      // Use webhook source or API key for identification
      const apiKey = request.headers.get("x-api-key");
      const webhookSource = request.headers.get("x-webhook-source");
      return apiKey || webhookSource || request.ip || "unknown";
    },
  }),
};

// Utility function to apply rate limiting to API routes
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter,
) {
  return async (request: NextRequest) => {
    const rateLimitResult = await limiter.checkRateLimit(request);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded. Try again in ${rateLimitResult.info.retryAfter} seconds.`,
          retryAfter: rateLimitResult.info.retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.info.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.info.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.info.resetTime.toISOString(),
            "Retry-After": rateLimitResult.info.retryAfter?.toString() || "60",
          },
        },
      );
    }

    // Execute the handler
    const response = await handler(request);

    // Add rate limit headers
    response.headers.set(
      "X-RateLimit-Limit",
      rateLimitResult.info.limit.toString(),
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.info.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      rateLimitResult.info.resetTime.toISOString(),
    );

    return response;
  };
}

// Advanced rate limiter with different limits for different user tiers
export class TieredRateLimiter {
  private limiters = new Map<string, RateLimiter>();

  constructor(
    private tiers: Record<string, RateLimitConfig>,
    private getTier: (request: NextRequest) => Promise<string>,
  ) {
    // Initialize rate limiters for each tier
    Object.entries(this.tiers).forEach(([tier, config]) => {
      this.limiters.set(tier, new RateLimiter(config));
    });
  }

  async checkRateLimit(request: NextRequest) {
    const tier = await this.getTier(request);
    const limiter = this.limiters.get(tier) || this.limiters.get("default");

    if (!limiter) {
      throw new Error(`No rate limiter configured for tier: ${tier}`);
    }

    return limiter.checkRateLimit(request);
  }
}

// Example tiered rate limiter for different subscription plans
export const tieredApiLimiter = new TieredRateLimiter(
  {
    free: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50,
    },
    pro: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 500,
    },
    enterprise: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5000,
    },
    default: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // Very restrictive for unknown users
    },
  },
  async (request) => {
    // Prefer API key based tier
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
      const validation = await apiKeyManager.validateApiKey(apiKey);
      if (validation.valid && validation.apiKey) {
        const requests = validation.apiKey.rateLimit?.requests || 0;
        if (requests >= 5000) return "enterprise";
        if (requests >= 500) return "pro";
        return "free";
      }
    }

    // Allow an explicit hint header when session middleware sets it
    const hinted = request.headers.get("x-subscription-plan");
    if (hinted && ["free", "pro", "enterprise"].includes(hinted)) {
      return hinted;
    }

    return "default";
  },
);
