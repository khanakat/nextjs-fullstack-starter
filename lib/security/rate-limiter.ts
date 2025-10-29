import { NextRequest } from "next/server";
import {
  RateLimitConfig,
  RateLimitResult,
  RateLimitTier,
} from "@/lib/types/security";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private generateKey(identifier: string, windowMs: number): string {
    const window = Math.floor(Date.now() / windowMs);
    return `${identifier}:${window}`;
  }

  async checkLimit(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const key = this.generateKey(identifier, config.windowMs);
    const now = Date.now();
    const resetTime = Math.ceil(now / config.windowMs) * config.windowMs;

    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime,
      };
    }

    const entry = this.store[key];
    entry.count++;

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
      allowed,
      remaining,
      resetTime,
      totalHits: entry.count,
    };
  }

  async reset(identifier: string, windowMs: number): Promise<void> {
    const key = this.generateKey(identifier, windowMs);
    delete this.store[key];
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter };

// Rate limiting tiers
export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  IP: {
    name: "IP-based",
    priority: 1,
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },
  USER: {
    name: "User-based",
    priority: 2,
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },
  ORGANIZATION: {
    name: "Organization-based",
    priority: 3,
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },
  API_KEY: {
    name: "API Key-based",
    priority: 4,
    config: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },
};

// Helper functions for generating identifiers
export function getIPIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIP || req.ip || "unknown";
  return `ip:${ip}`;
}

export function getUserIdentifier(userId: string): string {
  return `user:${userId}`;
}

export function getOrganizationIdentifier(orgId: string): string {
  return `org:${orgId}`;
}

export function getAPIKeyIdentifier(apiKey: string): string {
  return `apikey:${apiKey}`;
}

// Main rate limiting function
export async function checkRateLimit(
  _req: NextRequest,
  identifiers: Array<{ type: keyof typeof RATE_LIMIT_TIERS; value: string }>,
): Promise<{ allowed: boolean; tier?: string; result?: RateLimitResult }> {
  // Sort by priority (lowest first - most restrictive)
  const sortedIdentifiers = identifiers
    .map(({ type, value }) => ({
      tier: RATE_LIMIT_TIERS[type],
      identifier: value,
    }))
    .sort((a, b) => a.tier.priority - b.tier.priority);

  // Check each tier, return first violation
  for (const { tier, identifier } of sortedIdentifiers) {
    const result = await rateLimiter.checkLimit(identifier, tier.config);

    if (!result.allowed) {
      return {
        allowed: false,
        tier: tier.name,
        result,
      };
    }
  }

  return { allowed: true };
}
