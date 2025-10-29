import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateRequestId } from "@/lib/utils";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { handleZodError } from "@/lib/error-handlers";

const updatePermissionSchema = z.object({
  permissionType: z.enum(["view", "edit", "admin"]),
});

// PUT /api/reports/permissions/[id] - Update a permission
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Updating report permission", "reports", {
      requestId,
      permissionId: params.id,
    });

    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "reports", { requestId });
      return StandardErrorResponse.unauthorized(requestId);
    }

    const permissionId = params.id;
    const body = await _request.json();

    const validationResult = updatePermissionSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Validation failed for permission update", "reports", {
        requestId,
        errors: validationResult.error.errors,
      });
      return handleZodError(validationResult.error, requestId);
    }

    const { permissionType } = validationResult.data;

    // Find the permission
    const existingPermission = await db.reportPermission.findUnique({
      where: { id: permissionId },
      include: {
        report: true,
      },
    });

    if (!existingPermission) {
      logger.warn("Permission not found", "reports", {
        requestId,
        permissionId,
      });
      return StandardErrorResponse.notFound("Permission not found", requestId);
    }

    // Check if user has admin access
    const userPermission = await db.reportPermission.findFirst({
      where: {
        userId,
        reportId: existingPermission.reportId,
      },
    });

    const isOwner = existingPermission.report.createdBy === userId;
    const hasAdminAccess =
      isOwner || userPermission?.permissionType === "admin";

    if (!hasAdminAccess) {
      logger.warn("Insufficient permissions to update permission", "reports", {
        requestId,
        userId,
        permissionId,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions",
        requestId,
      );
    }

    // Update the permission
    const updatedPermission = await db.reportPermission.update({
      where: { id: permissionId },
      data: { permissionType },
    });

    logger.info("Permission updated successfully", "reports", {
      requestId,
      permissionId,
      newPermission: permissionType,
    });

    return StandardSuccessResponse.ok(updatedPermission, requestId);
  } catch (error) {
    logger.error("Error updating permission", "reports", {
      requestId,
      permissionId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to update permission",
      requestId,
    );
  }
}

// DELETE /api/reports/permissions/[id] - Delete a permission
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const requestId = generateRequestId();

  try {
    logger.info("Deleting report permission", "reports", {
      requestId,
      permissionId: params.id,
    });

    const { userId } = auth();
    if (!userId) {
      logger.warn("Unauthorized access attempt", "reports", { requestId });
      return StandardErrorResponse.unauthorized(requestId);
    }

    const permissionId = params.id;

    // Find the permission
    const existingPermission = await db.reportPermission.findUnique({
      where: { id: permissionId },
      include: {
        report: true,
      },
    });

    if (!existingPermission) {
      logger.warn("Permission not found", "reports", {
        requestId,
        permissionId,
      });
      return StandardErrorResponse.notFound("Permission not found", requestId);
    }

    // Check if user has admin access
    const userPermission = await db.reportPermission.findFirst({
      where: {
        userId,
        reportId: existingPermission.reportId,
      },
    });

    const isOwner = existingPermission.report.createdBy === userId;
    const hasAdminAccess =
      isOwner || userPermission?.permissionType === "admin";

    if (!hasAdminAccess) {
      logger.warn("Insufficient permissions to delete permission", "reports", {
        requestId,
        userId,
        permissionId,
      });
      return StandardErrorResponse.forbidden(
        "Insufficient permissions",
        requestId,
      );
    }

    // Delete the permission
    await db.reportPermission.delete({
      where: { id: permissionId },
    });

    logger.info("Permission deleted successfully", "reports", {
      requestId,
      permissionId,
    });

    return StandardSuccessResponse.ok({ success: true }, requestId);
  } catch (error) {
    logger.error("Error deleting permission", "reports", {
      requestId,
      permissionId: params.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return StandardErrorResponse.internal(
      "Failed to delete permission",
      requestId,
    );
  }
}
