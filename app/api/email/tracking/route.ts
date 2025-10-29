import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { db } from "@/lib/db";

// Validation schemas
const TrackingEventSchema = z.object({
  emailId: z.string().min(1, "Email ID is required"),
  eventType: z.enum([
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounced",
    "complained",
    "unsubscribed",
  ]),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  linkUrl: z.string().url().optional(), // For click events
});

const TrackingQuerySchema = z.object({
  emailId: z.string().optional(),
  eventType: z
    .enum([
      "sent",
      "delivered",
      "opened",
      "clicked",
      "bounced",
      "complained",
      "unsubscribed",
    ])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * POST /api/email/tracking - Record email tracking event
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication (optional for tracking pixels/webhooks)
    const { userId: authUserId } = auth();

    // For tracking events, we might receive webhooks without user auth
    if (authUserId) {
      userId = authUserId;

      // Get user's organization
      const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
          organizationMemberships: {
            include: { organization: true },
          },
        },
      });

      if (user?.organizationMemberships?.[0]) {
        organizationId = user.organizationMemberships[0].organizationId;
      }
    }

    logger.info("Recording email tracking event", "email", {
      requestId,
      userId,
      organizationId,
      hasAuth: !!authUserId,
    });

    // Parse and validate request body
    const body = await _request.json();
    const validatedData = TrackingEventSchema.parse(body);

    // Get client IP and user agent from headers
    const clientIP =
      _request.headers.get("x-forwarded-for") ||
      _request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = _request.headers.get("user-agent") || "unknown";

    // Create tracking event (mock implementation)
    const trackingEvent = {
      id: `event_${Date.now()}`,
      emailId: validatedData.emailId,
      eventType: validatedData.eventType,
      timestamp: validatedData.timestamp || new Date().toISOString(),
      metadata: validatedData.metadata || {},
      userAgent: validatedData.userAgent || userAgent,
      ipAddress: validatedData.ipAddress || clientIP,
      linkUrl: validatedData.linkUrl,
      organizationId,
      createdAt: new Date().toISOString(),
    };

    logger.info("Email tracking event recorded", "email", {
      requestId,
      userId,
      organizationId,
      eventId: trackingEvent.id,
      emailId: validatedData.emailId,
      eventType: validatedData.eventType,
    });

    return StandardSuccessResponse.create(
      {
        message: "Tracking event recorded successfully",
        event: trackingEvent,
        requestId,
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error recording email tracking event", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email/tracking",
    });

    return StandardErrorResponse.internal(
      "Failed to record tracking event",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}

/**
 * GET /api/email/tracking - Get email tracking data and analytics
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to access email tracking data",
        requestId,
      );
    }
    userId = authUserId;

    // Get user's organization and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.organizationMemberships?.[0]) {
      return StandardErrorResponse.forbidden(
        "Organization membership required to access email tracking data",
        requestId,
      );
    }

    organizationId = user.organizationMemberships[0].organizationId;

    // Check permissions
    const userWithRole = {
      id: user.id,
      email: user.email,
      role: user.organizationMemberships[0].role as UserRole,
      organizationId: user.organizationMemberships[0].organizationId,
    };

    if (!hasPermission(userWithRole, "read", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to access email tracking data",
        requestId,
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(_request.url);
    const queryData = TrackingQuerySchema.parse({
      emailId: searchParams.get("emailId"),
      eventType: searchParams.get("eventType"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    logger.info("Fetching email tracking data", "email", {
      requestId,
      userId,
      organizationId,
      filters: queryData,
    });

    // Mock tracking data
    const mockTrackingData = {
      summary: {
        totalEmails: 1250,
        delivered: 1198,
        opened: 856,
        clicked: 234,
        bounced: 32,
        complained: 5,
        unsubscribed: 12,
        deliveryRate: 95.8,
        openRate: 71.4,
        clickRate: 19.5,
        bounceRate: 2.6,
        complaintRate: 0.4,
        unsubscribeRate: 1.0,
      },
      events: [
        {
          id: "event_1",
          emailId: "email_123",
          eventType: "opened",
          timestamp: new Date().toISOString(),
          userAgent: "Mozilla/5.0...",
          ipAddress: "192.168.1.1",
          metadata: {
            location: "New York, US",
            device: "Desktop",
          },
        },
        {
          id: "event_2",
          emailId: "email_124",
          eventType: "clicked",
          timestamp: new Date().toISOString(),
          linkUrl: "https://example.com/product",
          userAgent: "Mozilla/5.0...",
          ipAddress: "192.168.1.2",
          metadata: {
            location: "London, UK",
            device: "Mobile",
          },
        },
      ],
      timeSeriesData: [
        {
          date: new Date().toISOString().split("T")[0],
          sent: 125,
          delivered: 120,
          opened: 85,
          clicked: 23,
          bounced: 3,
        },
      ],
    };

    // Apply filters to mock data
    let filteredEvents = mockTrackingData.events;
    if (queryData.emailId) {
      filteredEvents = filteredEvents.filter(
        (e) => e.emailId === queryData.emailId,
      );
    }
    if (queryData.eventType) {
      filteredEvents = filteredEvents.filter(
        (e) => e.eventType === queryData.eventType,
      );
    }

    // Pagination
    const startIndex = (queryData.page - 1) * queryData.limit;
    const paginatedEvents = filteredEvents.slice(
      startIndex,
      startIndex + queryData.limit,
    );

    return StandardSuccessResponse.create({
      summary: mockTrackingData.summary,
      events: paginatedEvents,
      timeSeriesData: mockTrackingData.timeSeriesData,
      pagination: {
        page: queryData.page,
        limit: queryData.limit,
        total: filteredEvents.length,
        totalPages: Math.ceil(filteredEvents.length / queryData.limit),
      },
      filters: queryData,
      requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error fetching email tracking data", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email/tracking",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch email tracking data",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
