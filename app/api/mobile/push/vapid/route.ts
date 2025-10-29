import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";

export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing VAPID public key request", "mobile", { requestId });

    // Check if VAPID public key is configured
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      logger.error("VAPID public key not configured", "mobile", {
        requestId,
        error: "VAPID_PUBLIC_KEY environment variable is not set",
      });
      return StandardErrorResponse.internal(
        "Push notifications are not configured",
      );
    }

    logger.info("VAPID public key retrieved successfully", "mobile", {
      requestId,
      keyLength: vapidPublicKey.length,
    });

    return StandardSuccessResponse.ok({
      publicKey: vapidPublicKey,
    });
  } catch (error) {
    logger.error("Failed to retrieve VAPID public key", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve VAPID public key",
    );
  }
}
