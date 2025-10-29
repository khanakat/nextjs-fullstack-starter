import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";
import { hasPermission, UserRole } from "@/lib/permissions";
import { SubscriptionService } from "@/lib/subscription-service";
import { subscriptionPlans } from "@/lib/stripe";

// Validation schemas
const CreateSubscriptionSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
  plan: z.enum(["free", "pro", "enterprise"] as const),
});

/**
 * POST /api/subscription
 * Create a new subscription checkout session
 */
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "subscription", {
        requestId,
        endpoint: "/api/subscription",
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Get user and organization
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMemberships: true },
    });

    if (!user || !user.organizationMemberships.length) {
      logger.warn("User not found or no organization", "subscription", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "User not found or not part of organization",
      );
    }

    // Permission check
    const userWithRole = {
      ...user,
      role: user.organizationMemberships[0].role as UserRole,
    };

    if (!hasPermission(userWithRole, "create", "subscription")) {
      logger.warn("Insufficient permissions", "subscription", {
        requestId,
        userId,
        action: "subscription:create",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to create subscriptions",
      );
    }

    // Parse and validate request body
    const body = await _request.json();
    const validationResult = CreateSubscriptionSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid request body", "subscription", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error);
    }

    const { priceId, plan } = validationResult.data;

    // Validate subscription plan
    if (!subscriptionPlans[plan as keyof typeof subscriptionPlans]) {
      logger.warn("Invalid subscription plan", "subscription", {
        requestId,
        plan,
      });
      return StandardErrorResponse.badRequest("Invalid subscription plan");
    }

    // Create checkout session
    const session = await SubscriptionService.createCheckoutSession(
      userId,
      priceId,
      plan,
    );

    logger.info("Subscription checkout session created", "subscription", {
      requestId,
      userId,
      plan,
      sessionId: session.id,
    });

    return StandardSuccessResponse.created(
      {
        sessionId: session.id,
        url: session.url,
      },
      "Checkout session created successfully",
    );
  } catch (error) {
    logger.error("Error creating subscription", "subscription", error);
    return StandardErrorResponse.internal("Failed to create subscription");
  }
}

/**
 * GET /api/subscription
 * Get user subscription information
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "subscription", {
        requestId,
        endpoint: "/api/subscription",
      });
      return StandardErrorResponse.unauthorized("Authentication required");
    }

    // Get user and organization
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { organizationMemberships: true },
    });

    if (!user || !user.organizationMemberships.length) {
      logger.warn("User not found or no organization", "subscription", {
        requestId,
        userId,
      });
      return StandardErrorResponse.forbidden(
        "User not found or not part of organization",
      );
    }

    // Permission check
    const userWithRole = {
      ...user,
      role: user.organizationMemberships[0].role as UserRole,
    };

    if (!hasPermission(userWithRole, "read", "subscription")) {
      logger.warn("Insufficient permissions", "subscription", {
        requestId,
        userId,
        action: "subscription:read",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to read subscriptions",
      );
    }

    // Get subscription information
    const subscription = await SubscriptionService.getUserSubscription(userId);
    const hasActive = await SubscriptionService.hasActiveSubscription(userId);
    const limits = await SubscriptionService.getSubscriptionLimits(userId);

    logger.info("Subscription information retrieved", "subscription", {
      requestId,
      userId,
      hasActiveSubscription: hasActive,
    });

    return StandardSuccessResponse.ok({
      subscription,
      hasActiveSubscription: hasActive,
      limits,
      plans: subscriptionPlans,
    });
  } catch (error) {
    logger.error("Error retrieving subscription", "subscription", error);
    return StandardErrorResponse.internal("Failed to retrieve subscription");
  }
}
