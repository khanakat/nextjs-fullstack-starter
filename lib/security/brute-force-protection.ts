import { NextRequest } from "next/server";
import {
  BruteForceProtection,
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from "@/lib/types/security";

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

interface BruteForceStore {
  [key: string]: AttemptRecord;
}

class BruteForceProtector {
  private store: BruteForceStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      10 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      const record = this.store[key];
      // Remove records that are older than 24 hours and not locked
      if (
        !record.lockedUntil &&
        now - record.lastAttempt > 24 * 60 * 60 * 1000
      ) {
        delete this.store[key];
      }
      // Remove expired locks
      if (record.lockedUntil && record.lockedUntil < now) {
        delete this.store[key];
      }
    });
  }

  private generateKey(
    identifier: string,
    type: "login" | "api" | "password_reset",
  ): string {
    return `${type}:${identifier}`;
  }

  private calculateDelay(
    attemptCount: number,
    progressiveDelay: boolean,
  ): number {
    if (!progressiveDelay) return 0;

    // Progressive delay: 1s, 2s, 4s, 8s, 16s, max 60s
    return Math.min(Math.pow(2, attemptCount - 1) * 1000, 60000);
  }

  async recordAttempt(
    identifier: string,
    type: "login" | "api" | "password_reset",
    config: BruteForceProtection,
    success: boolean = false,
  ): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    lockedUntil?: number;
    delay?: number;
    securityEvent?: SecurityEvent;
  }> {
    const key = this.generateKey(identifier, type);
    const now = Date.now();

    // If successful, reset the counter
    if (success) {
      delete this.store[key];
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
      };
    }

    let record = this.store[key];

    // Initialize or reset if window expired
    if (!record || now - record.firstAttempt > config.windowMs) {
      record = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
      };
    }

    // Check if currently locked
    if (record.lockedUntil && record.lockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: record.lockedUntil,
      };
    }

    // Increment attempt count
    record.count++;
    record.lastAttempt = now;

    // Check if max attempts exceeded
    if (record.count >= config.maxAttempts) {
      record.lockedUntil = now + config.lockoutDuration;

      const securityEvent: SecurityEvent = {
        id: `bf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        timestamp: new Date(),
        ipAddress: identifier.startsWith("ip:")
          ? identifier.substring(3)
          : "unknown",
        userAgent: "unknown",
        endpoint: type,
        details: {
          attemptCount: record.count,
          lockoutDuration: config.lockoutDuration,
          identifier: identifier,
          type: type,
        },
        resolved: false,
      };

      this.store[key] = record;

      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: record.lockedUntil,
        securityEvent,
      };
    }

    // Calculate progressive delay
    const delay = this.calculateDelay(record.count, config.progressiveDelay);

    this.store[key] = record;

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - record.count,
      delay,
    };
  }

  async isLocked(
    identifier: string,
    type: "login" | "api" | "password_reset",
  ): Promise<{
    locked: boolean;
    lockedUntil?: number;
    remainingAttempts: number;
  }> {
    const key = this.generateKey(identifier, type);
    const record = this.store[key];
    const now = Date.now();

    if (!record) {
      return {
        locked: false,
        remainingAttempts: 10, // Default max attempts
      };
    }

    if (record.lockedUntil && record.lockedUntil > now) {
      return {
        locked: true,
        lockedUntil: record.lockedUntil,
        remainingAttempts: 0,
      };
    }

    return {
      locked: false,
      remainingAttempts: Math.max(0, 10 - record.count), // Default max attempts
    };
  }

  async reset(
    identifier: string,
    type: "login" | "api" | "password_reset",
  ): Promise<void> {
    const key = this.generateKey(identifier, type);
    delete this.store[key];
  }

  async getAttemptInfo(
    identifier: string,
    type: "login" | "api" | "password_reset",
  ): Promise<AttemptRecord | null> {
    const key = this.generateKey(identifier, type);
    return this.store[key] || null;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
const bruteForceProtector = new BruteForceProtector();

export { bruteForceProtector };

// Default configurations for different types
export const BRUTE_FORCE_CONFIGS = {
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    progressiveDelay: true,
  },
  API: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 60 * 60 * 1000, // 1 hour
    progressiveDelay: false,
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDuration: 2 * 60 * 60 * 1000, // 2 hours
    progressiveDelay: true,
  },
};

// Helper functions
export function getIdentifierFromRequest(
  req: NextRequest,
  type: "ip" | "user" | "email",
): string {
  switch (type) {
    case "ip":
      const forwarded = req.headers.get("x-forwarded-for");
      const realIP = req.headers.get("x-real-ip");
      const ip = forwarded?.split(",")[0] || realIP || req.ip || "unknown";
      return `ip:${ip}`;

    case "user":
      const userId = req.headers.get("x-user-id");
      return userId
        ? `user:${userId}`
        : `ip:${getIdentifierFromRequest(req, "ip").substring(3)}`;

    case "email":
      // This would typically come from request body
      return "email:unknown";

    default:
      return "unknown";
  }
}

export async function checkBruteForce(
  _req: NextRequest,
  identifier: string,
  type: "login" | "api" | "password_reset",
  success: boolean = false,
): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
  delay?: number;
  securityEvent?: SecurityEvent;
}> {
  const config =
    BRUTE_FORCE_CONFIGS[type.toUpperCase() as keyof typeof BRUTE_FORCE_CONFIGS];
  return bruteForceProtector.recordAttempt(identifier, type, config, success);
}

export async function isAccountLocked(
  identifier: string,
  type: "login" | "api" | "password_reset",
): Promise<{
  locked: boolean;
  lockedUntil?: number;
  remainingAttempts: number;
}> {
  return bruteForceProtector.isLocked(identifier, type);
}

export async function resetBruteForceCounter(
  identifier: string,
  type: "login" | "api" | "password_reset",
): Promise<void> {
  return bruteForceProtector.reset(identifier, type);
}

// Middleware helper
export function createBruteForceMiddleware(
  type: "login" | "api" | "password_reset",
  identifierType: "ip" | "user" | "email" = "ip",
) {
  return async (req: NextRequest) => {
    const identifier = getIdentifierFromRequest(req, identifierType);
    const lockStatus = await isAccountLocked(identifier, type);

    if (lockStatus.locked) {
      return {
        blocked: true,
        reason: "Account temporarily locked due to too many failed attempts",
        lockedUntil: lockStatus.lockedUntil,
        remainingAttempts: lockStatus.remainingAttempts,
      };
    }

    return {
      blocked: false,
      remainingAttempts: lockStatus.remainingAttempts,
    };
  };
}
