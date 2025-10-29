import { NextRequest } from "next/server";
import {
  StandardErrorResponse,
  StandardSuccessResponse,
} from "@/lib/standardized-error-responses";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";
import { handleZodError } from "@/lib/error-handlers";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { z } from "zod";

const deviceRegistrationSchema = z.object({
  deviceId: z.string(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
  platform: z.string(),
  browserName: z.string(),
  browserVersion: z.string(),
  screenWidth: z.number(),
  screenHeight: z.number(),
  userAgent: z.string(),
  capabilities: z.object({
    pushNotifications: z.boolean(),
    serviceWorker: z.boolean(),
    indexedDB: z.boolean(),
    webShare: z.boolean(),
    geolocation: z.boolean(),
    camera: z.boolean(),
    vibration: z.boolean(),
    touchScreen: z.boolean(),
    orientation: z.boolean(),
  }),
  timezone: z.string(),
  language: z.string(),
});

const deviceUpdateSchema = z.object({
  lastSeen: z.string().datetime().optional(),
  capabilities: z
    .object({
      pushNotifications: z.boolean(),
      serviceWorker: z.boolean(),
      indexedDB: z.boolean(),
      webShare: z.boolean(),
      geolocation: z.boolean(),
      camera: z.boolean(),
      vibration: z.boolean(),
      touchScreen: z.boolean(),
      orientation: z.boolean(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

// POST - Register a new device
export async function POST(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing mobile device registration request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized device registration attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const body = await _request.json();
    const deviceData = deviceRegistrationSchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        organizationMemberships: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn("User not found for device registration", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    // Check if device already exists
    const existingDevice = await prisma.deviceInfo.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceData.deviceId,
      },
    });

    let device;

    if (existingDevice) {
      // Update existing device
      device = await prisma.deviceInfo.update({
        where: { id: existingDevice.id },
        data: {
          deviceType: deviceData.deviceType,
          platform: deviceData.platform,
          browserName: deviceData.browserName,
          browserVersion: deviceData.browserVersion,
          screenWidth: deviceData.screenWidth,
          screenHeight: deviceData.screenHeight,
          userAgent: deviceData.userAgent,
          capabilities: JSON.stringify(deviceData.capabilities),
          timezone: deviceData.timezone,
          language: deviceData.language,
          lastSeen: new Date(),
          isActive: true,
        },
      });

      logger.info("Mobile device updated successfully", "mobile", {
        requestId,
        deviceId: device.id,
        deviceType: device.deviceType,
        userId: user.id,
      });
    } else {
      // Create new device
      device = await prisma.deviceInfo.create({
        data: {
          userId: user.id,
          deviceId: deviceData.deviceId,
          deviceType: deviceData.deviceType,
          platform: deviceData.platform,
          browserName: deviceData.browserName,
          browserVersion: deviceData.browserVersion,
          screenWidth: deviceData.screenWidth,
          screenHeight: deviceData.screenHeight,
          userAgent: deviceData.userAgent,
          capabilities: JSON.stringify(deviceData.capabilities),
          timezone: deviceData.timezone,
          language: deviceData.language,
          lastSeen: new Date(),
          isActive: true,
        },
      });

      logger.info("Mobile device registered successfully", "mobile", {
        requestId,
        deviceId: device.id,
        deviceType: device.deviceType,
        userId: user.id,
      });
    }

    return StandardSuccessResponse.created(
      {
        device: {
          id: device.id,
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          platform: device.platform,
          browserName: device.browserName,
          browserVersion: device.browserVersion,
          capabilities: JSON.parse(device.capabilities || "{}"),
          isActive: device.isActive,
          lastSeen: device.lastSeen,
        },
        message: existingDevice
          ? "Device updated successfully"
          : "Device registered successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in device registration request", "mobile", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error processing mobile device registration", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/device",
    });

    return StandardErrorResponse.internal(
      "Failed to register device",
      requestId,
    );
  }
}

// GET - Get user devices
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing mobile devices retrieval request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized devices retrieval attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.warn("User not found for devices retrieval", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    if (deviceId) {
      // Get specific device
      const device = await prisma.deviceInfo.findFirst({
        where: {
          userId: user.id,
          deviceId: deviceId,
        },
        select: {
          id: true,
          deviceId: true,
          deviceType: true,
          platform: true,
          browserName: true,
          browserVersion: true,
          screenWidth: true,
          screenHeight: true,
          capabilities: true,
          timezone: true,
          language: true,
          isActive: true,
          lastSeen: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!device) {
        logger.warn("Device not found", "mobile", {
          requestId,
          deviceId,
          userId: user.id,
        });
        return StandardErrorResponse.notFound("Device not found", requestId);
      }

      logger.info("Mobile device retrieved successfully", "mobile", {
        requestId,
        deviceId: device.id,
        deviceType: device.deviceType,
      });

      return StandardSuccessResponse.ok(
        {
          device,
        },
        requestId,
      );
    }

    // Get all user devices
    const whereClause: any = { userId: user.id };
    if (activeOnly) {
      whereClause.isActive = true;
    }

    const devices = await prisma.deviceInfo.findMany({
      where: whereClause,
      select: {
        id: true,
        deviceId: true,
        deviceType: true,
        platform: true,
        browserName: true,
        browserVersion: true,
        screenWidth: true,
        screenHeight: true,
        capabilities: true,
        timezone: true,
        language: true,
        isActive: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { lastSeen: "desc" },
    });

    logger.info("Mobile devices retrieved successfully", "mobile", {
      requestId,
      count: devices.length,
      activeOnly,
      userId: user.id,
    });

    return StandardSuccessResponse.ok(
      {
        devices: devices.map((device) => ({
          ...device,
          capabilities: JSON.parse(device.capabilities || "{}"),
        })),
        total: devices.length,
        activeCount: devices.filter((d) => d.isActive).length,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error retrieving mobile devices", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/device",
    });

    return StandardErrorResponse.internal(
      "Failed to retrieve devices",
      requestId,
    );
  }
}

// PUT - Update device information
export async function PUT(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing mobile device update request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized device update attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      logger.warn("Device ID missing in update request", "mobile", {
        requestId,
      });
      return StandardErrorResponse.badRequest(
        "Device ID is required",
        requestId,
      );
    }

    const body = await _request.json();
    const updateData = deviceUpdateSchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.warn("User not found for device update", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    // Find and update device
    const device = await prisma.deviceInfo.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceId,
      },
    });

    if (!device) {
      logger.warn("Device not found for update", "mobile", {
        requestId,
        deviceId,
        userId: user.id,
      });
      return StandardErrorResponse.notFound("Device not found", requestId);
    }

    const updatedDevice = await prisma.deviceInfo.update({
      where: { id: device.id },
      data: {
        ...updateData,
        capabilities: updateData.capabilities
          ? JSON.stringify(updateData.capabilities)
          : undefined,
        lastSeen: updateData.lastSeen
          ? new Date(updateData.lastSeen)
          : new Date(),
      },
      select: {
        id: true,
        deviceId: true,
        deviceType: true,
        platform: true,
        browserName: true,
        browserVersion: true,
        capabilities: true,
        isActive: true,
        lastSeen: true,
        updatedAt: true,
      },
    });

    logger.info("Mobile device updated successfully", "mobile", {
      requestId,
      deviceId: updatedDevice.id,
      updatedFields: Object.keys(updateData),
    });

    return StandardSuccessResponse.ok(
      {
        device: {
          ...updatedDevice,
          capabilities: JSON.parse(updatedDevice.capabilities || "{}"),
        },
        message: "Device updated successfully",
      },
      requestId,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Validation error in device update request", "mobile", {
        requestId,
        errors: error.errors,
      });
      return handleZodError(error, requestId);
    }

    logger.error("Error updating mobile device", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/device",
    });

    return StandardErrorResponse.internal("Failed to update device", requestId);
  }
}

// DELETE - Remove device
export async function DELETE(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    logger.info("Processing mobile device deletion request", "mobile", {
      requestId,
    });

    const { userId } = await auth();

    if (!userId) {
      logger.warn("Unauthorized device deletion attempt", "mobile", {
        requestId,
      });
      return StandardErrorResponse.unauthorized(
        "Authentication required",
        requestId,
      );
    }

    const { searchParams } = new URL(_request.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId) {
      logger.warn("Device ID missing in deletion request", "mobile", {
        requestId,
      });
      return StandardErrorResponse.badRequest(
        "Device ID is required",
        requestId,
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      logger.warn("User not found for device deletion", "mobile", {
        requestId,
        userId,
      });
      return StandardErrorResponse.notFound("User not found", requestId);
    }

    // Find and delete device
    const device = await prisma.deviceInfo.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceId,
      },
    });

    if (!device) {
      logger.warn("Device not found for deletion", "mobile", {
        requestId,
        deviceId,
        userId: user.id,
      });
      return StandardErrorResponse.notFound("Device not found", requestId);
    }

    await prisma.deviceInfo.delete({
      where: { id: device.id },
    });

    logger.info("Mobile device deleted successfully", "mobile", {
      requestId,
      deviceId: device.id,
      deviceType: device.deviceType,
    });

    return StandardSuccessResponse.ok(
      {
        message: "Device deleted successfully",
        deviceId: device.deviceId,
      },
      requestId,
    );
  } catch (error) {
    logger.error("Error deleting mobile device", "mobile", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint: "/api/mobile/device",
    });

    return StandardErrorResponse.internal("Failed to delete device", requestId);
  }
}
