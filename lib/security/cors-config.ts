import { NextRequest, NextResponse } from "next/server";
import { logCorsViolation } from "./security-monitor";

export interface CorsConfig {
  allowedOrigins: string[] | "*";
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  credentials: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins:
    process.env.NODE_ENV === "production"
      ? process.env.ALLOWED_ORIGINS?.split(",") || ["https://yourdomain.com"]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-File-Name",
    "X-Organization-Id",
  ],
  exposedHeaders: [
    "X-Total-Count",
    "X-Rate-Limit-Remaining",
    "X-Rate-Limit-Reset",
    "X-Organization-Id",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

export const API_CORS_CONFIG: CorsConfig = {
  ...DEFAULT_CORS_CONFIG,
  allowedOrigins:
    process.env.NODE_ENV === "production"
      ? process.env.API_ALLOWED_ORIGINS?.split(",") || [
          "https://yourdomain.com",
        ]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  allowedHeaders: [
    ...DEFAULT_CORS_CONFIG.allowedHeaders,
    "X-API-Key",
    "X-Client-Version",
  ],
};

export const WEBHOOK_CORS_CONFIG: CorsConfig = {
  allowedOrigins: ["*"], // Webhooks often come from various sources
  allowedMethods: ["POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "X-Webhook-Signature",
    "X-Hub-Signature",
    "X-GitHub-Event",
    "X-Stripe-Signature",
  ],
  credentials: false,
  maxAge: 300, // 5 minutes
};

class CorsHandler {
  private config: CorsConfig;

  constructor(config: CorsConfig = DEFAULT_CORS_CONFIG) {
    this.config = config;
  }

  private isOriginAllowed(origin: string | null): boolean {
    if (!origin) return false;

    if (this.config.allowedOrigins === "*") {
      return true;
    }

    if (Array.isArray(this.config.allowedOrigins)) {
      return this.config.allowedOrigins.includes(origin);
    }

    return false;
  }

  private isMethodAllowed(method: string): boolean {
    return this.config.allowedMethods.includes(method.toUpperCase());
  }

  private areHeadersAllowed(headers: string): boolean {
    if (!headers) return true;

    const requestedHeaders = headers
      .split(",")
      .map((h) => h.trim().toLowerCase());

    const allowedHeaders = this.config.allowedHeaders.map((h) =>
      h.toLowerCase(),
    );

    return requestedHeaders.every(
      (header) => allowedHeaders.includes(header) || header.startsWith("x-"), // Allow custom headers starting with x-
    );
  }

  async handleCors(req: NextRequest): Promise<NextResponse | null> {
    const origin = req.headers.get("origin");
    const method = req.method;
    const requestedMethod = req.headers.get("access-control-request-method");
    const requestedHeaders = req.headers.get("access-control-request-headers");

    // Handle preflight requests
    if (method === "OPTIONS") {
      return this.handlePreflight(
        req,
        origin,
        requestedMethod,
        requestedHeaders,
      );
    }

    // Handle actual requests
    return this.handleActualRequest(req, origin, method);
  }

  private async handlePreflight(
    req: NextRequest,
    origin: string | null,
    requestedMethod: string | null,
    requestedHeaders: string | null,
  ): Promise<NextResponse> {
    const response = new NextResponse(null, {
      status: this.config.optionsSuccessStatus || 200,
    });

    // Check origin
    if (!this.isOriginAllowed(origin)) {
      await logCorsViolation(req, origin || "null", "OPTIONS");
      return new NextResponse("CORS: Origin not allowed", { status: 403 });
    }

    // Check method
    if (requestedMethod && !this.isMethodAllowed(requestedMethod)) {
      await logCorsViolation(req, origin || "null", requestedMethod);
      return new NextResponse("CORS: Method not allowed", { status: 405 });
    }

    // Check headers
    if (requestedHeaders && !this.areHeadersAllowed(requestedHeaders)) {
      await logCorsViolation(req, origin || "null", "OPTIONS");
      return new NextResponse("CORS: Headers not allowed", { status: 403 });
    }

    // Set CORS headers
    this.setCorsHeaders(response, origin);

    return response;
  }

  private async handleActualRequest(
    req: NextRequest,
    origin: string | null,
    method: string,
  ): Promise<NextResponse | null> {
    // Check origin for actual requests
    if (origin && !this.isOriginAllowed(origin)) {
      await logCorsViolation(req, origin, method);
      return new NextResponse("CORS: Origin not allowed", { status: 403 });
    }

    // Check method
    if (!this.isMethodAllowed(method)) {
      await logCorsViolation(req, origin || "null", method);
      return new NextResponse("CORS: Method not allowed", { status: 405 });
    }

    // CORS is valid, return null to continue processing
    return null;
  }

  private setCorsHeaders(response: NextResponse, origin: string | null) {
    // Set allowed origin
    if (this.config.allowedOrigins === "*") {
      response.headers.set("Access-Control-Allow-Origin", "*");
    } else if (origin && this.isOriginAllowed(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Vary", "Origin");
    }

    // Set allowed methods
    response.headers.set(
      "Access-Control-Allow-Methods",
      this.config.allowedMethods.join(", "),
    );

    // Set allowed headers
    response.headers.set(
      "Access-Control-Allow-Headers",
      this.config.allowedHeaders.join(", "),
    );

    // Set exposed headers
    if (this.config.exposedHeaders && this.config.exposedHeaders.length > 0) {
      response.headers.set(
        "Access-Control-Expose-Headers",
        this.config.exposedHeaders.join(", "),
      );
    }

    // Set credentials
    if (this.config.credentials) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    // Set max age
    if (this.config.maxAge) {
      response.headers.set(
        "Access-Control-Max-Age",
        this.config.maxAge.toString(),
      );
    }
  }

  applyCorsHeaders(response: NextResponse, origin: string | null) {
    this.setCorsHeaders(response, origin);
  }
}

// Create CORS middleware function
export function createCorsMiddleware(config: CorsConfig = DEFAULT_CORS_CONFIG) {
  const corsHandler = new CorsHandler(config);

  return async function corsMiddleware(
    req: NextRequest,
  ): Promise<NextResponse | null> {
    return corsHandler.handleCors(req);
  };
}

// Helper function to apply CORS headers to any response
export function applyCorsHeaders(
  response: NextResponse,
  req: NextRequest,
  config: CorsConfig = DEFAULT_CORS_CONFIG,
) {
  const corsHandler = new CorsHandler(config);
  const origin = req.headers.get("origin");
  corsHandler.applyCorsHeaders(response, origin);
}

// Environment-specific CORS configurations
export const CORS_CONFIGS = {
  development: {
    ...DEFAULT_CORS_CONFIG,
    allowedOrigins: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ],
  },

  production: {
    ...DEFAULT_CORS_CONFIG,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "https://yourdomain.com",
    ],
  },

  api: {
    ...API_CORS_CONFIG,
  },

  webhook: {
    ...WEBHOOK_CORS_CONFIG,
  },
};

// Get CORS config based on environment and route type
export function getCorsConfig(
  routeType: "default" | "api" | "webhook" = "default",
): CorsConfig {
  const env = process.env.NODE_ENV || "development";

  if (routeType === "webhook") {
    return CORS_CONFIGS.webhook;
  }

  if (routeType === "api") {
    return CORS_CONFIGS.api;
  }

  return (
    CORS_CONFIGS[env as keyof typeof CORS_CONFIGS] || CORS_CONFIGS.development
  );
}
