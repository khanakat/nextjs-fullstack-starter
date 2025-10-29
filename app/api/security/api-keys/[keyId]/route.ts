import { NextRequest, NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { apiKeyManager } from "@/lib/security/api-key-manager";
import { ApiKeyPermission } from "@/lib/types/security";

interface RouteParams {
  params: {
    keyId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = params;
    const apiKey = await apiKeyManager.getApiKey(keyId);

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Check if user has access to this organization
    const organizationId = req.headers.get("x-organization-id");
    if (apiKey.organizationId !== organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get usage stats for the last 30 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const usageStats = await apiKeyManager.getUsageStats(keyId, {
      start: startDate,
      end: endDate,
    });

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        organizationId: apiKey.organizationId,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
        usageCount: apiKey.usageCount,
        keyPreview: apiKey.keyHash.substring(0, 8) + "...",
      },
      usageStats,
    });
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      keyId: params.keyId,
      endpoint: "/api/security/api-keys/:keyId",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process security request", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = params;
    const body = await req.json();
    const { name, permissions, isActive, expiresAt, rateLimit } = body;

    const apiKey = await apiKeyManager.getApiKey(keyId);
    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Check if user has access to this organization
    const organizationId = req.headers.get("x-organization-id");
    if (apiKey.organizationId !== organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = Object.values(ApiKeyPermission);
      const invalidPermissions = permissions.filter(
        (p: string) => !validPermissions.includes(p as ApiKeyPermission),
      );

      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          { error: `Invalid permissions: ${invalidPermissions.join(", ")}` },
          { status: 400 },
        );
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (permissions !== undefined) updates.permissions = permissions;
    if (isActive !== undefined) updates.isActive = isActive;
    if (expiresAt !== undefined)
      updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (rateLimit !== undefined) updates.rateLimit = rateLimit;

    const updated = await apiKeyManager.updateApiKey(keyId, updates);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update API key" },
        { status: 500 },
      );
    }

    const updatedKey = await apiKeyManager.getApiKey(keyId);

    return NextResponse.json({
      apiKey: {
        id: updatedKey!.id,
        name: updatedKey!.name,
        organizationId: updatedKey!.organizationId,
        permissions: updatedKey!.permissions,
        isActive: updatedKey!.isActive,
        createdAt: updatedKey!.createdAt,
        lastUsedAt: updatedKey!.lastUsedAt,
        expiresAt: updatedKey!.expiresAt,
        rateLimit: updatedKey!.rateLimit,
        usageCount: updatedKey!.usageCount,
      },
      message: "API key updated successfully",
    });
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      keyId: params.keyId,
      endpoint: "/api/security/api-keys/:keyId",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process security request", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = params;
    const apiKey = await apiKeyManager.getApiKey(keyId);

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Check if user has access to this organization
    const organizationId = req.headers.get("x-organization-id");
    if (apiKey.organizationId !== organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const deleted = await apiKeyManager.deleteApiKey(keyId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error) {
    logger.apiError("Error processing security request", "security", error, {
      keyId: params.keyId,
      endpoint: "/api/security/api-keys/:keyId",
    });

    if (error instanceof ApiError) {
      return errorResponse(error);
    }

    return errorResponse("Failed to process security request", 500);
  }
}
