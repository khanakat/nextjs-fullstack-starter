import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { currentUser } from "@clerk/nextjs/server";
import { SubscriptionService } from "@/lib/subscription-service";

export async function POST(_req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const session = await SubscriptionService.createBillingPortalSession(
      user.id,
    );

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    logger.error(
      "Error processing subscription request",
      "subscription",
      error,
    );

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process subscription request", 500);
  }
}
