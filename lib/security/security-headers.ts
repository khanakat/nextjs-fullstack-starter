import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface SecurityHeadersConfig {
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  contentSecurityPolicy?: {
    directives?: Record<string, string | string[]>;
    reportOnly?: boolean;
  };
  frameOptions?: "DENY" | "SAMEORIGIN" | string;
  contentTypeOptions?: boolean;
  xssProtection?: {
    enabled?: boolean;
    mode?: "block" | "report";
    reportUri?: string;
  };
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string | string[]>;
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://clerk.com",
        "https://*.clerk.accounts.dev",
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "connect-src": [
        "'self'",
        "https://clerk.com",
        "https://*.clerk.accounts.dev",
        "https://api.stripe.com",
      ],
      "frame-src": [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com",
      ],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    },
    reportOnly: false,
  },
  frameOptions: "DENY",
  contentTypeOptions: true,
  xssProtection: {
    enabled: true,
    mode: "block",
  },
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: {
    camera: ["none"],
    microphone: ["none"],
    geolocation: ["none"],
    "interest-cohort": ["none"],
  },
};

function buildCSP(directives: Record<string, string | string[]>): string {
  return Object.entries(directives)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0 ? `${key} ${value.join(" ")}` : key;
      }
      return `${key} ${value}`;
    })
    .join("; ");
}

function buildPermissionsPolicy(
  permissions: Record<string, string | string[]>,
): string {
  return Object.entries(permissions)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=(${value.join(" ")})`;
      }
      return `${key}=(${value})`;
    })
    .join(", ");
}

export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = DEFAULT_CONFIG,
): NextResponse {
  // HSTS (HTTP Strict Transport Security)
  if (config.hsts) {
    const {
      maxAge = 31536000,
      includeSubDomains = true,
      preload = true,
    } = config.hsts;
    let hstsValue = `max-age=${maxAge}`;
    if (includeSubDomains) hstsValue += "; includeSubDomains";
    if (preload) hstsValue += "; preload";
    response.headers.set("Strict-Transport-Security", hstsValue);
  }

  // Content Security Policy
  if (config.contentSecurityPolicy?.directives) {
    const cspValue = buildCSP(config.contentSecurityPolicy.directives);
    const headerName = config.contentSecurityPolicy.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";
    response.headers.set(headerName, cspValue);
  }

  // X-Frame-Options
  if (config.frameOptions) {
    response.headers.set("X-Frame-Options", config.frameOptions);
  }

  // X-Content-Type-Options
  if (config.contentTypeOptions) {
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  // X-XSS-Protection
  if (config.xssProtection?.enabled) {
    let xssValue = "1";
    if (config.xssProtection.mode === "block") {
      xssValue += "; mode=block";
    } else if (
      config.xssProtection.mode === "report" &&
      config.xssProtection.reportUri
    ) {
      xssValue += `; report=${config.xssProtection.reportUri}`;
    }
    response.headers.set("X-XSS-Protection", xssValue);
  }

  // Referrer Policy
  if (config.referrerPolicy) {
    response.headers.set("Referrer-Policy", config.referrerPolicy);
  }

  // Permissions Policy
  if (config.permissionsPolicy) {
    const permissionsValue = buildPermissionsPolicy(config.permissionsPolicy);
    response.headers.set("Permissions-Policy", permissionsValue);
  }

  // Additional security headers
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  return response;
}

export function createSecurityHeadersMiddleware(
  config?: SecurityHeadersConfig,
) {
  return (_req: NextRequest, response: NextResponse) => {
    return applySecurityHeaders(response, { ...DEFAULT_CONFIG, ...config });
  };
}

// Environment-specific configurations
export const SECURITY_CONFIGS = {
  development: {
    ...DEFAULT_CONFIG,
    contentSecurityPolicy: {
      ...DEFAULT_CONFIG.contentSecurityPolicy,
      directives: {
        ...DEFAULT_CONFIG.contentSecurityPolicy?.directives,
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://clerk.com",
          "https://*.clerk.accounts.dev",
          "localhost:*",
          "127.0.0.1:*",
        ],
        "connect-src": [
          "'self'",
          "https://clerk.com",
          "https://*.clerk.accounts.dev",
          "https://api.stripe.com",
          "ws://localhost:*",
          "ws://127.0.0.1:*",
          "http://localhost:*",
          "http://127.0.0.1:*",
        ],
      },
    },
  },
  production: DEFAULT_CONFIG,
};

export function getSecurityConfig(): SecurityHeadersConfig {
  const env = process.env.NODE_ENV || "development";
  return (
    SECURITY_CONFIGS[env as keyof typeof SECURITY_CONFIGS] ||
    SECURITY_CONFIGS.development
  );
}
