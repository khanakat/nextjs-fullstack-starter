import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { OAuthService } from "../../../../../api/services/integrations/OAuthService";
import { generateRequestId } from "@/lib/utils";

/**
 * GET /api/integrations/oauth/callback - Handle OAuth callback
 */
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(_request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const integrationId = searchParams.get("integration_id");

    logger.info("Processing OAuth callback", "API", {
      requestId,
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      integrationId,
    });

    // Handle OAuth error
    if (error) {
      const errorDescription =
        searchParams.get("error_description") || "OAuth authorization failed";

      logger.warn("OAuth authorization error received", "API", {
        requestId,
        error,
        errorDescription,
        integrationId,
      });

      // Redirect to frontend with error
      const redirectUrl = new URL(
        "/integrations",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      );
      redirectUrl.searchParams.set("error", error);
      redirectUrl.searchParams.set("error_description", errorDescription);

      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code || !state || !integrationId) {
      logger.warn("Missing required OAuth parameters", "API", {
        requestId,
        hasCode: !!code,
        hasState: !!state,
        hasIntegrationId: !!integrationId,
      });

      const redirectUrl = new URL(
        "/integrations",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      );
      redirectUrl.searchParams.set("error", "invalid_request");
      redirectUrl.searchParams.set(
        "error_description",
        "Missing required OAuth parameters",
      );

      return NextResponse.redirect(redirectUrl);
    }

    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized OAuth callback attempt", "API", {
        requestId,
        integrationId,
      });

      const redirectUrl = new URL(
        "/sign-in",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      );
      redirectUrl.searchParams.set("redirect_url", _request.url);

      return NextResponse.redirect(redirectUrl);
    }

    // Get user's organization through Clerk integration
    const userOrganization = await db.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!userOrganization) {
      logger.warn("No organization found for OAuth callback user", "API", {
        requestId,
        userId,
        integrationId,
      });

      const redirectUrl = new URL(
        "/integrations",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      );
      redirectUrl.searchParams.set("error", "no_organization");
      redirectUrl.searchParams.set(
        "error_description",
        "No organization found",
      );

      return NextResponse.redirect(redirectUrl);
    }

    const organizationId = userOrganization.organizationId;

    logger.info("Processing OAuth callback for authenticated user", "API", {
      requestId,
      userId,
      organizationId,
      integrationId,
    });

    // Handle OAuth callback
    const result = await OAuthService.handleCallback(
      integrationId,
      code,
      state,
      organizationId,
    );

    logger.info("OAuth callback processing completed", "API", {
      requestId,
      userId,
      organizationId,
      integrationId,
      success: result.success,
      hasConnectionId: !!result.connectionId,
      hasError: !!result.error,
    });

    // Redirect to frontend with result
    const redirectUrl = new URL(
      "/integrations",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    );

    if (result.success) {
      redirectUrl.searchParams.set("success", "true");
      redirectUrl.searchParams.set("integration_id", integrationId);
      redirectUrl.searchParams.set("connection_id", result.connectionId || "");

      logger.info(
        "OAuth callback successful, redirecting to success page",
        "API",
        {
          requestId,
          userId,
          integrationId,
          connectionId: result.connectionId,
        },
      );
    } else {
      redirectUrl.searchParams.set("error", "oauth_failed");
      redirectUrl.searchParams.set(
        "error_description",
        result.error || "OAuth callback failed",
      );
      redirectUrl.searchParams.set("integration_id", integrationId);

      logger.warn("OAuth callback failed, redirecting to error page", "API", {
        requestId,
        userId,
        integrationId,
        error: result.error,
      });
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.error("OAuth callback processing error", "API", {
      requestId,
      error,
    });

    const redirectUrl = new URL(
      "/integrations",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    );
    redirectUrl.searchParams.set("error", "callback_error");
    redirectUrl.searchParams.set(
      "error_description",
      "OAuth callback processing failed",
    );

    return NextResponse.redirect(redirectUrl);
  }
}
