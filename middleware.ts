import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { protectedRoutes } from "./lib/routes";
import { edgeRateLimiters } from "./lib/middleware/edge-rate-limiter";
import { createAuditMiddleware } from "./lib/middleware/audit-middleware";

const isProtectedRoute = createRouteMatcher(protectedRoutes);

// Initialize performance and security middleware
const auditMiddleware = createAuditMiddleware();

// Check if Clerk is properly configured (both publishable and secret keys present and not placeholders)
const hasValidClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_") &&
    process.env.CLERK_SECRET_KEY.startsWith("sk_") &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test") &&
    !process.env.CLERK_SECRET_KEY.startsWith("sk_test") &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_development_key" &&
    process.env.CLERK_SECRET_KEY !== "sk_test_development_key",
);

const middlewareHandler = async (auth: any, req: any) => {
  // Only protect routes if Clerk is properly configured
  if (hasValidClerkKeys && isProtectedRoute(req)) {
    auth().protect();
  }

  // Apply rate limiting for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    // Determine which rate limiter to use based on path
    let rateLimiter = edgeRateLimiters.api; // Default

    if (req.nextUrl.pathname.includes("/auth/")) {
      rateLimiter = edgeRateLimiters.auth;
    } else if (req.nextUrl.pathname.includes("/upload")) {
      rateLimiter = edgeRateLimiters.upload;
    } else if (
      req.nextUrl.pathname.includes("/export") ||
      req.nextUrl.pathname.includes("/reports")
    ) {
      rateLimiter = edgeRateLimiters.export;
    } else if (req.nextUrl.pathname.includes("/search")) {
      rateLimiter = edgeRateLimiters.search;
    } else if (req.nextUrl.pathname.includes("/webhook")) {
      rateLimiter = edgeRateLimiters.webhook;
    }

    // Check rate limit
    const rateLimitResult = await rateLimiter.checkRateLimit(req);
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

    // Get organization ID from query params or headers
    const orgId =
      req.nextUrl.searchParams.get("organizationId") ||
      req.headers.get("x-organization-id");

    // Add user ID from Clerk auth
    try {
      const authResult = auth ? auth() : null;
      const userId = authResult?.userId;
      if (userId) {
        // Apply audit middleware for authenticated requests
        const auditResponse = await auditMiddleware.middleware(req);
        if (auditResponse && auditResponse.status !== 200) {
          return auditResponse;
        }

        // Create response with headers
        const response = NextResponse.next();
        response.headers.set("x-user-id", userId);

        if (orgId) {
          response.headers.set("x-organization-id", orgId);
        }

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
      }
    } catch (error) {
      // User not authenticated, continue without user ID
    }
  }

  return NextResponse.next();
};

// Export conditional middleware
export default hasValidClerkKeys 
  ? clerkMiddleware(middlewareHandler)
  : async (req: any) => {
      // If Clerk is not configured, just run the middleware without auth
      return middlewareHandler(null, req);
    };

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
