/**
 * Simple in-memory rate limiter for API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly demoMaxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10, demoMaxRequests?: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.demoMaxRequests = demoMaxRequests || Math.floor(maxRequests * 1.5); // 50% more for demo users
  }

  isAllowed(identifier: string, isDemo: boolean = false): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);
    const limit = isDemo ? this.demoMaxRequests : this.maxRequests;

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(identifier: string, isDemo: boolean = false): number {
    const entry = this.requests.get(identifier);
    const limit = isDemo ? this.demoMaxRequests : this.maxRequests;
    if (!entry || Date.now() > entry.resetTime) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create rate limiter instances for different endpoints
export const statsRateLimiter = new RateLimiter(60000, 120, 200); // 120 requests per minute, 200 for demo users
export const generalRateLimiter = new RateLimiter(60000, 300, 500); // 300 requests per minute, 500 for demo users

// Cleanup expired entries every 5 minutes
setInterval(() => {
  statsRateLimiter.cleanup();
  generalRateLimiter.cleanup();
}, 5 * 60 * 1000);

export function createRateLimitResponse(resetTime: number) {
  return new Response(
    JSON.stringify({ 
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      resetTime: new Date(resetTime).toISOString()
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        "X-RateLimit-Reset": resetTime.toString(),
      },
    }
  );
}