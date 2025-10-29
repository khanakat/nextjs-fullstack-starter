import { NextRequest, NextResponse } from "next/server";
// Mock imports for now since some modules are not available
// import { checkRateLimit, RATE_LIMIT_TIERS } from "./rate-limiter";
// import { createSecurityHeadersMiddleware } from "./security-headers";
// import { RequestValidator } from "./request-validator";
// import { createBruteForceMiddleware } from "./brute-force-protection";
// import { createCorsMiddleware, getCorsConfig } from "./cors-config";
// import { createApiKeyMiddleware } from "./api-key-manager";
// import { logRateLimitExceeded, logInvalidRequest } from "./security-monitor";
// import { ApiKeyPermission } from "../types/security";

// Mock implementations for now
const RATE_LIMIT_TIERS = {
  IP: { requests: 100, windowMs: 60000 },
  USER: { requests: 1000, windowMs: 60000 },
  ORGANIZATION: { requests: 10000, windowMs: 60000 },
  API_KEY: { requests: 50000, windowMs: 60000 },
};

const checkRateLimit = async (..._args: any[]) => ({
  allowed: true,
  tier: "ip",
  remaining: 100,
  resetTime: Date.now() + 60000,
});

const createSecurityHeadersMiddleware = () => (_req: NextRequest, response: NextResponse) => response;

class RequestValidator {
  async validate(..._args: any[]) {
    return { valid: true };
  }
  
  async validateRequest(_req: NextRequest) {
    return { 
      isValid: true,
      errors: []
    };
  }
}

const createBruteForceMiddleware = (..._args: any[]) => async (_req: NextRequest) => ({
  blocked: false,
  remainingAttempts: 5,
});

const getCorsConfig = (_type: string) => ({
  allowedOrigins: "*" as string | string[],
  credentials: false,
  exposedHeaders: [],
});

const createCorsMiddleware = (_config: any) => async (_req: NextRequest) => null;

const createApiKeyMiddleware = (_permission?: any) => async (_req: NextRequest) => ({
  valid: true,
});

const logRateLimitExceeded = async (..._args: any[]) => {};
const logInvalidRequest = async (..._args: any[]) => {};

type ApiKeyPermission = string;

export interface SecurityMiddlewareConfig {
  enableRateLimit?: boolean;
  enableSecurityHeaders?: boolean;
  enableRequestValidation?: boolean;
  enableBruteForceProtection?: boolean;
  enableCors?: boolean;
  enableApiKeyAuth?: boolean;
  requiredApiPermission?: ApiKeyPermission;
  corsType?: "default" | "api" | "webhook";
  validatorType?: "api" | "upload" | "webhook" | "public";
  customRateLimits?: {
    ip?: { requests: number; windowMs: number };
    user?: { requests: number; windowMs: number };
    organization?: { requests: number; windowMs: number };
  };
}

const DEFAULT_CONFIG: SecurityMiddlewareConfig = {
  enableRateLimit: true,
  enableSecurityHeaders: true,
  enableRequestValidation: true,
  enableBruteForceProtection: true,
  enableCors: true,
  enableApiKeyAuth: false,
  corsType: "default",
  validatorType: "api",
};

export class SecurityMiddleware {
  private config: SecurityMiddlewareConfig;
  private securityHeadersMiddleware: (
    req: NextRequest,
    response: NextResponse,
  ) => NextResponse;
  private corsMiddleware: (req: NextRequest) => Promise<NextResponse | null>;
  private bruteForceMiddleware: (req: NextRequest) => Promise<any>;
  private apiKeyMiddleware?: (req: NextRequest) => Promise<any>;
  private requestValidator: RequestValidator;

  constructor(config: SecurityMiddlewareConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize middleware components
    this.securityHeadersMiddleware = createSecurityHeadersMiddleware();
    this.corsMiddleware = createCorsMiddleware(
      getCorsConfig(this.config.corsType || "api"),
    );
    this.bruteForceMiddleware = createBruteForceMiddleware("api", "ip");
    this.requestValidator = new RequestValidator();

    if (this.config.enableApiKeyAuth) {
      // Create the middleware function directly
      const requiredPermission = this.config.requiredApiPermission;
      this.apiKeyMiddleware = createApiKeyMiddleware(requiredPermission);
    }
  }

  async process(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    let response: NextResponse;

    try {
      // 1. CORS handling (must be first for preflight requests)
      if (this.config.enableCors) {
        const corsResponse = await this.corsMiddleware(req);
        if (corsResponse) {
          return corsResponse; // CORS error or preflight response
        }
      }

      // 2. Request validation
      if (this.config.enableRequestValidation) {
        const validationResult =
          await this.requestValidator.validateRequest(req);

        if (!validationResult.isValid) {
          await logInvalidRequest(req, validationResult.errors || []);
          return new NextResponse(
            JSON.stringify({
              error: "Invalid request",
              details: validationResult.errors,
            }),
            {
              status: 400,
              headers: new Headers({ "Content-Type": "application/json" }),
            },
          );
        }
      }

      // 3. Brute force protection
      if (this.config.enableBruteForceProtection) {
        const bruteForceResponse = await this.bruteForceMiddleware(req);
        if (bruteForceResponse) {
          return bruteForceResponse; // Account locked or too many attempts
        }
      }

      // 4. API Key authentication (if enabled)
      if (this.config.enableApiKeyAuth && this.apiKeyMiddleware) {
        const apiKeyResult = await this.apiKeyMiddleware(req);

        if (!apiKeyResult.valid) {
          if (apiKeyResult.rateLimitExceeded) {
            return new NextResponse(
              JSON.stringify({
                error: "Rate limit exceeded",
                message: "API key rate limit exceeded",
              }),
              {
                status: 429,
                headers: new Headers({
                  "Content-Type": "application/json",
                  "Retry-After": "3600",
                }),
              },
            );
          }

          return new NextResponse(
            JSON.stringify({
              error: "Unauthorized",
              message: apiKeyResult.error || "Invalid API key",
            }),
            {
              status: 401,
              headers: new Headers({ "Content-Type": "application/json" }),
            },
          );
        }

        // Add API key info to request headers for downstream processing
        const modifiedHeaders = new Headers(req.headers);
        modifiedHeaders.set("x-api-key-id", apiKeyResult.apiKey.id);
        modifiedHeaders.set(
          "x-api-key-org",
          apiKeyResult.apiKey.organizationId,
        );

        // Create new request with modified headers
        req = new NextRequest(req.url, {
          method: req.method,
          headers: modifiedHeaders,
          body: req.body,
        });
      }

      // 5. Rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitResult = await this.checkRateLimits(req);

        if (!rateLimitResult.allowed) {
          await logRateLimitExceeded(
            req,
            rateLimitResult.tier,
            rateLimitResult.remaining,
            rateLimitResult.resetTime,
          );

          return new NextResponse(
            JSON.stringify({
              error: "Rate limit exceeded",
              message: `Too many requests. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
              retryAfter: Math.ceil(
                (rateLimitResult.resetTime - Date.now()) / 1000,
              ),
            }),
            {
              status: 429,
              headers: new Headers({
                "Content-Type": "application/json",
                "X-Rate-Limit-Remaining": rateLimitResult.remaining.toString(),
                "X-Rate-Limit-Reset": rateLimitResult.resetTime.toString(),
                "Retry-After": Math.ceil(
                  (rateLimitResult.resetTime - Date.now()) / 1000,
                ).toString(),
              }),
            },
          );
        }

        // Add rate limit headers to successful responses
        response = NextResponse.next();
        response.headers.set(
          "X-Rate-Limit-Remaining",
          rateLimitResult.remaining.toString(),
        );
        response.headers.set(
          "X-Rate-Limit-Reset",
          rateLimitResult.resetTime.toString(),
        );
      } else {
        response = NextResponse.next();
      }

      // 6. Apply security headers
      if (this.config.enableSecurityHeaders) {
        response = this.securityHeadersMiddleware(req, response);
      }

      // 7. Apply CORS headers to the response
      if (this.config.enableCors) {
        const corsConfig = getCorsConfig(this.config.corsType || "api");
        const origin = req.headers.get("origin");

        if (corsConfig.allowedOrigins === "*") {
          response.headers.set("Access-Control-Allow-Origin", "*");
        } else if (
          origin &&
          Array.isArray(corsConfig.allowedOrigins) &&
          corsConfig.allowedOrigins.includes(origin)
        ) {
          response.headers.set("Access-Control-Allow-Origin", origin);
          response.headers.set("Vary", "Origin");
        }

        if (corsConfig.credentials) {
          response.headers.set("Access-Control-Allow-Credentials", "true");
        }

        if (corsConfig.exposedHeaders && corsConfig.exposedHeaders.length > 0) {
          response.headers.set(
            "Access-Control-Expose-Headers",
            corsConfig.exposedHeaders.join(", "),
          );
        }
      }

      // Add processing time header
      const processingTime = Date.now() - startTime;
      response.headers.set("X-Processing-Time", `${processingTime}ms`);

      return response;
    } catch (error) {
      console.error("Security middleware error:", error);

      return new NextResponse(
        JSON.stringify({
          error: "Internal server error",
          message: "Security processing failed",
        }),
        {
          status: 500,
          headers: new Headers({ "Content-Type": "application/json" }),
        },
      );
    }
  }

  private async checkRateLimits(req: NextRequest): Promise<{
    allowed: boolean;
    tier: string;
    remaining: number;
    resetTime: number;
  }> {
    try {
      const result = await checkRateLimit(
        this.extractIPAddress(req),
        this.config.customRateLimits || RATE_LIMIT_TIERS,
      );

      return {
        allowed: result.allowed,
        tier: result.tier,
        remaining: result.remaining || 0,
        resetTime: result.resetTime || Date.now(),
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      return {
        allowed: true,
        tier: "ip",
        remaining: 100,
        resetTime: Date.now() + 60000,
      };
    }
  }

  private extractIPAddress(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    return forwarded?.split(",")[0] || realIP || "unknown";
  }
}

// Factory functions for common configurations
export function createApiSecurityMiddleware(
  config: Partial<SecurityMiddlewareConfig> = {},
) {
  return new SecurityMiddleware({
    ...config,
    corsType: "api",
    validatorType: "api",
    enableApiKeyAuth: config.enableApiKeyAuth ?? false,
  });
}

export function createWebhookSecurityMiddleware(
  config: Partial<SecurityMiddlewareConfig> = {},
) {
  return new SecurityMiddleware({
    ...config,
    corsType: "webhook",
    validatorType: "webhook",
    enableApiKeyAuth: false,
    enableBruteForceProtection: false,
  });
}

export function createPublicSecurityMiddleware(
  config: Partial<SecurityMiddlewareConfig> = {},
) {
  return new SecurityMiddleware({
    ...config,
    corsType: "default",
    validatorType: "public",
    enableApiKeyAuth: false,
  });
}
