export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request) => void;
}

export interface RateLimitTier {
  name: string;
  config: RateLimitConfig;
  priority: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  details: Record<string, any>;
  resolved: boolean;
}

export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",
  SUSPICIOUS_REQUEST = "SUSPICIOUS_REQUEST",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  API_KEY_MISUSE = "API_KEY_MISUSE",
  CORS_VIOLATION = "CORS_VIOLATION",
  INVALID_REQUEST = "INVALID_REQUEST",
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
}

export enum SecuritySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  rateLimitViolations: number;
  bruteForceAttempts: number;
  suspiciousActivity: number;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topTargetedEndpoints: Array<{ endpoint: string; count: number }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export enum ApiKeyPermission {
  READ_ORGANIZATIONS = "READ_ORGANIZATIONS",
  WRITE_ORGANIZATIONS = "WRITE_ORGANIZATIONS",
  READ_USERS = "READ_USERS",
  WRITE_USERS = "WRITE_USERS",
  READ_REPORTS = "READ_REPORTS",
  WRITE_REPORTS = "WRITE_REPORTS",
  ADMIN_ACCESS = "ADMIN_ACCESS",
  WEBHOOK_ACCESS = "WEBHOOK_ACCESS",
  API_ACCESS = "API_ACCESS",
}

export interface ApiKey {
  id: string;
  name: string;
  organizationId: string;
  keyHash: string;
  permissions: ApiKeyPermission[];
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  rateLimit: { requests: number; windowMs: number };
  usageCount: number;
}

export interface ApiKeyUsage {
  timestamp: Date;
  endpoint: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  responseStatus: number;
  responseTime: number;
}

export interface BruteForceProtection {
  maxAttempts: number;
  windowMs: number;
  lockoutDuration: number;
  progressiveDelay: boolean;
}

export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean;
    tiers: {
      ip: RateLimitConfig;
      user: RateLimitConfig;
      organization: RateLimitConfig;
      apiKey: RateLimitConfig;
    };
  };
  bruteForceProtection: BruteForceProtection;
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  securityHeaders: {
    enabled: boolean;
    hsts: boolean;
    noSniff: boolean;
    frameOptions: string;
    xssProtection: boolean;
    contentSecurityPolicy: string;
  };
  monitoring: {
    enabled: boolean;
    logLevel: "error" | "warn" | "info" | "debug";
    retentionDays: number;
  };
}
