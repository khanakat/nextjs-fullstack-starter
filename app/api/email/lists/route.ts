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
const CreateEmailListSchema = z.object({
  name: z.string().min(1, "List name is required").max(100, "Name too long"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  allowSelfSubscribe: z.boolean().default(true),
  requireDoubleOptIn: z.boolean().default(true),
  welcomeEmailTemplateId: z.string().optional(),
  unsubscribeRedirectUrl: z.string().url().optional(),
});

/**
 * POST /api/email/lists - Create a new email list
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    // Authentication
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return StandardErrorResponse.unauthorized(
        "Authentication required to create email lists",
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
        "Organization membership required to create email lists",
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

    if (!hasPermission(userWithRole, "create", "organizations")) {
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to create email lists",
        requestId,
      );
    }

    logger.info("Creating email list", "email", {
      requestId,
      userId,
      organizationId,
    });

    // Parse and validate request body
    const body = await _request.json();
    const validatedData = CreateEmailListSchema.parse(body);

    // Check for duplicate list names within organization
    // Mock implementation - in production, check actual database
    const existingList = false; // Mock check

    if (existingList) {
      return StandardErrorResponse.conflict(
        "A list with this name already exists",
        requestId,
      );
    }

    // Create email list (mock implementation)
    const listId = `list_${Date.now()}`;
    const emailList = {
      id: listId,
      ...validatedData,
      organizationId,
      createdBy: userId,
      subscriberCount: 0,
      activeSubscriberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info("Email list created successfully", "email", {
      requestId,
      userId,
      organizationId,
      listId,
      listName: validatedData.name,
    });

    return StandardSuccessResponse.create(
      {
        message: "Email list created successfully",
        list: emailList,
        requestId,
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error, requestId);
    }

    logger.error("Error creating email list", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email/lists",
    });

    return StandardErrorResponse.internal(
      "Failed to create email list",
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
 * GET /api/email/lists - Get email lists
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
        "Authentication required to access email lists",
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
        "Organization membership required to access email lists",
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
        "Insufficient permissions to access email lists",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const isPublic = searchParams.get("isPublic");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    logger.info("Fetching email lists", "email", {
      requestId,
      userId,
      organizationId,
      isPublic,
      page,
      limit,
      search,
      tag,
    });

    // Mock email lists data
    const mockLists = [
      {
        id: "list_1",
        name: "Newsletter Subscribers",
        description: "Monthly newsletter subscribers",
        subscriberCount: 1250,
        activeSubscriberCount: 1198,
        isPublic: true,
        allowSelfSubscribe: true,
        requireDoubleOptIn: true,
        tags: ["newsletter", "marketing"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEmailSent: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: "list_2",
        name: "Product Updates",
        description: "Users interested in product announcements",
        subscriberCount: 856,
        activeSubscriberCount: 823,
        isPublic: false,
        allowSelfSubscribe: false,
        requireDoubleOptIn: true,
        tags: ["product", "updates"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEmailSent: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: "list_3",
        name: "VIP Customers",
        description: "High-value customers and partners",
        subscriberCount: 89,
        activeSubscriberCount: 87,
        isPublic: false,
        allowSelfSubscribe: false,
        requireDoubleOptIn: false,
        tags: ["vip", "customers"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEmailSent: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ];

    // Apply filters
    let filteredLists = mockLists;
    if (isPublic !== null) {
      filteredLists = filteredLists.filter(
        (l) => l.isPublic === (isPublic === "true"),
      );
    }
    if (search) {
      filteredLists = filteredLists.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (tag) {
      filteredLists = filteredLists.filter((l) => l.tags.includes(tag));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedLists = filteredLists.slice(startIndex, startIndex + limit);

    // Calculate summary statistics
    const totalSubscribers = mockLists.reduce(
      (sum, list) => sum + list.subscriberCount,
      0,
    );
    const totalActiveSubscribers = mockLists.reduce(
      (sum, list) => sum + list.activeSubscriberCount,
      0,
    );

    return StandardSuccessResponse.create({
      lists: paginatedLists,
      summary: {
        totalLists: mockLists.length,
        totalSubscribers,
        totalActiveSubscribers,
        averageEngagementRate: (
          (totalActiveSubscribers / totalSubscribers) *
          100
        ).toFixed(1),
      },
      pagination: {
        page,
        limit,
        total: filteredLists.length,
        totalPages: Math.ceil(filteredLists.length / limit),
      },
      filters: {
        isPublic,
        search,
        tag,
      },
      requestId,
    });
  } catch (error) {
    logger.error("Error fetching email lists", "email", {
      requestId,
      userId,
      organizationId,
      error: error instanceof Error ? error.message : error,
      endpoint: "/api/email/lists",
    });

    return StandardErrorResponse.internal(
      "Failed to fetch email lists",
      process.env.NODE_ENV === "development"
        ? {
            originalError: error instanceof Error ? error.message : error,
          }
        : undefined,
      requestId,
    );
  }
}
