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

// Zod schemas
const SubscriptionIdSchema = z.object({
  id: z.string().min(1, "Subscription ID is required"),
});

const UpdateSubscriptionSchema = z.object({
  status: z.enum(["active", "canceled", "paused"]).optional(),
  plan: z.string().optional(),
  priceId: z.string().optional(),
});

/**
 * GET /api/subscription/[id]
 * Get a specific subscription by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "subscription", {
        requestId,
        endpoint: `/api/subscription/${params.id}`,
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

    // Validate subscription ID
    const validationResult = SubscriptionIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      logger.warn("Invalid subscription ID", "subscription", {
        requestId,
        subscriptionId: params.id,
      });
      return handleZodError(validationResult.error);
    }

    // Get subscription details
    const subscription = await db.userSubscription.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!subscription) {
      logger.warn("Subscription not found", "subscription", {
        requestId,
        subscriptionId: params.id,
      });
      return StandardErrorResponse.notFound("Subscription not found");
    }

    // Check if user owns the subscription or has admin permissions
    if (
      subscription.userId !== userId &&
      !hasPermission(userWithRole, "admin", "subscription")
    ) {
      logger.warn(
        "Insufficient permissions to view this subscription",
        "subscription",
        {
          requestId,
          userId,
          subscriptionId: params.id,
          subscriptionUserId: subscription.userId,
        },
      );
      return StandardErrorResponse.forbidden(
        "You can only view your own subscriptions",
      );
    }

    logger.info("Subscription retrieved successfully", "subscription", {
      requestId,
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    return StandardSuccessResponse.ok(subscription);
  } catch (error) {
    logger.error("Error retrieving subscription", "subscription", error);
    return StandardErrorResponse.internal("Failed to retrieve subscription");
  }
}

/**
 * PUT /api/subscription/[id]
 * Update a specific subscription
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "subscription", {
        requestId,
        endpoint: `/api/subscription/${params.id}`,
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

    if (!hasPermission(userWithRole, "update", "subscription")) {
      logger.warn("Insufficient permissions", "subscription", {
        requestId,
        userId,
        action: "subscription:update",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to update subscriptions",
      );
    }

    // Validate subscription ID
    const idValidationResult = SubscriptionIdSchema.safeParse({
      id: params.id,
    });
    if (!idValidationResult.success) {
      logger.warn("Invalid subscription ID", "subscription", {
        requestId,
        subscriptionId: params.id,
      });
      return handleZodError(idValidationResult.error);
    }

    // Check if subscription exists
    const existingSubscription = await db.userSubscription.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, status: true },
    });

    if (!existingSubscription) {
      logger.warn("Subscription not found", "subscription", {
        requestId,
        subscriptionId: params.id,
      });
      return StandardErrorResponse.notFound("Subscription not found");
    }

    // Check if user owns the subscription or has admin permissions
    if (
      existingSubscription.userId !== userId &&
      !hasPermission(userWithRole, "admin", "subscription")
    ) {
      logger.warn(
        "Insufficient permissions to update this subscription",
        "subscription",
        {
          requestId,
          userId,
          subscriptionId: params.id,
          subscriptionUserId: existingSubscription.userId,
        },
      );
      return StandardErrorResponse.forbidden(
        "You can only update your own subscriptions",
      );
    }

    // Parse and validate request body
    const body = await _request.json();
    const validationResult = UpdateSubscriptionSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("Invalid request body", "subscription", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error);
    }

    const data = validationResult.data;

    // Update subscription
    const updatedSubscription = await db.userSubscription.update({
      where: { id: params.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.plan && { plan: data.plan }),
        ...(data.priceId && { stripePriceId: data.priceId }),
      },
    });

    logger.info("Subscription updated successfully", "subscription", {
      requestId,
      userId,
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
    });

    return StandardSuccessResponse.ok(
      updatedSubscription,
      "Subscription updated successfully",
    );
  } catch (error) {
    logger.error("Error updating subscription", "subscription", error);
    return StandardErrorResponse.internal("Failed to update subscription");
  }
}

/**
 * DELETE /api/subscription/[id]
 * Cancel a specific subscription
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "subscription", {
        requestId,
        endpoint: `/api/subscription/${params.id}`,
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

    if (!hasPermission(userWithRole, "delete", "subscription")) {
      logger.warn("Insufficient permissions", "subscription", {
        requestId,
        userId,
        action: "subscription:delete",
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions to delete subscriptions",
      );
    }

    // Validate subscription ID
    const validationResult = SubscriptionIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      logger.warn("Invalid subscription ID", "subscription", {
        requestId,
        subscriptionId: params.id,
      });
      return handleZodError(validationResult.error);
    }

    // Check if subscription exists
    const existingSubscription = await db.userSubscription.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, status: true },
    });

    if (!existingSubscription) {
      logger.warn("Subscription not found", "subscription", {
        requestId,
        subscriptionId: params.id,
      });
      return StandardErrorResponse.notFound("Subscription not found");
    }

    // Check if user owns the subscription or has admin permissions
    if (
      existingSubscription.userId !== userId &&
      !hasPermission(userWithRole, "admin", "subscription")
    ) {
      logger.warn(
        "Insufficient permissions to cancel this subscription",
        "subscription",
        {
          requestId,
          userId,
          subscriptionId: params.id,
          subscriptionUserId: existingSubscription.userId,
        },
      );
      return StandardErrorResponse.forbidden(
        "You can only cancel your own subscriptions",
      );
    }

    // Cancel subscription
    const canceledSubscription = await db.userSubscription.update({
      where: { id: params.id },
      data: {
        status: "canceled",
        cancelAtPeriodEnd: true,
      },
    });

    logger.info("Subscription canceled successfully", "subscription", {
      requestId,
      userId,
      subscriptionId: params.id,
      status: canceledSubscription.status,
    });

    return StandardSuccessResponse.ok(
      { id: params.id, status: canceledSubscription.status },
      "Subscription canceled successfully",
    );
  } catch (error) {
    logger.error("Error canceling subscription", "subscription", error);
    return StandardErrorResponse.internal("Failed to cancel subscription");
  }
}
