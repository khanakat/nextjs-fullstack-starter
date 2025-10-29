import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { apiKeyManager } from "@/lib/security/api-key-manager";
import { ApiKeyPermission } from "@/lib/types/security";

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = req.headers.get("x-organization-id");
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 },
      );
    }

    const apiKeys = await apiKeyManager.getApiKeys(organizationId);

    // Remove sensitive information before sending
    const sanitizedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      organizationId: key.organizationId,
      permissions: key.permissions,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      rateLimit: key.rateLimit,
      usageCount: key.usageCount,
      keyPreview: key.keyHash.substring(0, 8) + "...", // Show only first 8 chars of hash
    }));

    return NextResponse.json({ apiKeys: sanitizedKeys });
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      endpoint: "/api/security/api-keys",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process security request", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = req.headers.get("x-organization-id");
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, permissions, expiresAt, rateLimit } = body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Name and permissions are required" },
        { status: 400 },
      );
    }

    // Validate permissions
    const validPermissions = Object.values(ApiKeyPermission);
    const invalidPermissions = permissions.filter(
      (p) => !validPermissions.includes(p),
    );

    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPermissions.join(", ")}` },
        { status: 400 },
      );
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : undefined;
    const rateLimitConfig = rateLimit || {
      requests: 1000,
      windowMs: 60 * 60 * 1000,
    };

    const { apiKey, secretKey } = await apiKeyManager.createApiKey(
      name,
      organizationId,
      permissions,
      expirationDate,
      rateLimitConfig,
    );

    // Return the secret key only once during creation
    return NextResponse.json(
      {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          organizationId: apiKey.organizationId,
          permissions: apiKey.permissions,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
          expiresAt: apiKey.expiresAt,
          rateLimit: apiKey.rateLimit,
        },
        secretKey, // Only returned during creation
        message:
          "API key created successfully. Save the secret key securely - it will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      endpoint: "/api/security/api-keys",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process security request", 500);
  }
}
