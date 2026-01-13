import { auth } from "@/lib/conditional-auth";
import { NextResponse } from "next/server";
import { SubscriptionService } from "@/lib/subscription-service";
import { logger } from "@/lib/logger";

/**
 * Middleware to check subscription status and plan limits
 * Use this to protect premium features and API routes
 */

export interface SubscriptionRequirement {
  plans: string[]; // Required plans: ['pro', 'enterprise']
  feature?: string; // Feature name for limit checking
}

type FeatureKey = "uploads" | "emails" | "apiCalls";

type PlanLimits = Record<
  "free" | "pro" | "enterprise",
  Record<FeatureKey, number>
>;

const planLimits: PlanLimits = {
  free: {
    uploads: 5,
    emails: 10,
    apiCalls: 100,
  },
  pro: {
    uploads: -1,
    emails: 1000,
    apiCalls: 10000,
  },
  enterprise: {
    uploads: -1,
    emails: -1,
    apiCalls: -1,
  },
};

type UsageCounters = {
  [userId: string]: {
    windowStart: number;
    uploads: number;
    emails: number;
    apiCalls: number;
  };
};

const usageCounters: UsageCounters = {};
const USAGE_WINDOW_MS = 24 * 60 * 60 * 1000; // reset daily

function getUsageCounter(userId: string) {
  const now = Date.now();
  const existing = usageCounters[userId];
  if (!existing || now - existing.windowStart > USAGE_WINDOW_MS) {
    usageCounters[userId] = {
      windowStart: now,
      uploads: 0,
      emails: 0,
      apiCalls: 0,
    };
  }
  return usageCounters[userId];
}

export function recordUsage(
  userId: string,
  feature: FeatureKey,
  amount: number = 1,
) {
  const counter = getUsageCounter(userId);
  counter[feature] += amount;
}

export async function requireSubscription(
  requirement: SubscriptionRequirement,
): Promise<{ success: boolean; error?: string; subscription?: any }> {
  try {
    const { userId } = auth();

    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const subscription = await SubscriptionService.getUserSubscription(userId);

    // Check if user has required plan
    const userPlan = subscription?.plan || "free";
    const hasRequiredPlan = requirement.plans.includes(userPlan);

    if (!hasRequiredPlan) {
      return {
        success: false,
        error: `This feature requires a ${requirement.plans.join(" or ")} subscription`,
        subscription,
      };
    }

    // If feature limit checking is requested
    if (requirement.feature) {
      // This would integrate with your usage tracking system
      // For now, we'll just check the plan
      const hasUsageLeft = await checkFeatureUsage(
        userId,
        requirement.feature,
        userPlan,
      );

      if (!hasUsageLeft) {
        return {
          success: false,
          error: `You've reached the limit for this feature on your ${userPlan} plan`,
          subscription,
        };
      }
    }

    return {
      success: true,
      subscription,
    };
  } catch (error) {
    console.error("Subscription check error:", error);
    return {
      success: false,
      error: "Failed to verify subscription status",
    };
  }
}

/**
 * Check feature usage against plan limits
 */
async function checkFeatureUsage(
  userId: string,
  feature: string,
  plan: string,
): Promise<boolean> {
  const limits = planLimits[plan as keyof typeof planLimits];

  if (!limits) {
    return false;
  }

  const limit = limits[feature as keyof typeof limits];

  if (limit === -1) {
    return true; // unlimited
  }

  if (limit === undefined) {
    return false; // feature not available
  }

  // Simple in-memory usage tracking with daily reset
  const usage = getUsageCounter(userId)[feature as FeatureKey] || 0;

  return limit === -1 ? true : usage < limit;
}

/**
 * API Route wrapper for subscription protection
 */
export function withSubscription(
  handler: (req: Request, context: any) => Promise<Response>,
  requirement: SubscriptionRequirement,
) {
  return async (req: Request, context: any) => {
    const subscriptionCheck = await requireSubscription(requirement);

    if (!subscriptionCheck.success) {
      return NextResponse.json(
        {
          error: subscriptionCheck.error,
          upgrade: true,
        },
        { status: 403 },
      );
    }

    // Add subscription info to context
    const enhancedContext = {
      ...context,
      subscription: subscriptionCheck.subscription,
    };

    return handler(req, enhancedContext);
  };
}

/**
 * Server-side subscription check for pages
 * Returns redirect information if access denied
 */
export async function checkPageAccess(
  requirement: SubscriptionRequirement,
): Promise<{
  allowed: boolean;
  error?: string;
  subscription?: any;
  redirectTo?: string;
}> {
  const subscriptionCheck = await requireSubscription(requirement);

  if (!subscriptionCheck.success) {
    return {
      allowed: false,
      error: subscriptionCheck.error,
      redirectTo: "/dashboard?upgrade=true",
    };
  }

  return {
    allowed: true,
    subscription: subscriptionCheck.subscription,
  };
}

/**
 * Helper function to create subscription-protected API routes
 */
export function createProtectedRoute(
  handlers: {
    GET?: (req: Request, context: any) => Promise<Response>;
    POST?: (req: Request, context: any) => Promise<Response>;
    PUT?: (req: Request, context: any) => Promise<Response>;
    DELETE?: (req: Request, context: any) => Promise<Response>;
  },
  requirement: SubscriptionRequirement,
) {
  const protectedHandlers: any = {};

  Object.entries(handlers).forEach(([method, handler]) => {
    if (handler) {
      protectedHandlers[method] = withSubscription(handler, requirement);
    }
  });

  return protectedHandlers;
}

// Example usage patterns:

/*
// Protect API route
export const { GET, POST } = createProtectedRoute(
  {
    GET: async (req, context) => {
      return NextResponse.json({ message: "Protected data" });
    },
    POST: async (req, context) => {
      // context.subscription contains user's subscription
      return NextResponse.json({ success: true });
    }
  },
  { plans: ['pro', 'enterprise'] }
);

// Check page access in server component
export default async function PremiumPage() {
  const accessCheck = await checkPageAccess({ 
    plans: ['pro', 'enterprise'] 
  });
  
  if (!accessCheck.allowed) {
    redirect(accessCheck.redirectTo || '/dashboard');
  }
  
  return <div>Premium content here</div>;
}

// Manual subscription check in server action
export async function premiumAction() {
  const check = await requireSubscription({ 
    plans: ['pro'], 
    feature: 'uploads' 
  });
  
  if (!check.success) {
    throw new Error(check.error);
  }
  
  // Proceed with premium action
}
*/
