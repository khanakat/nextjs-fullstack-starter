import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { SecurityAuditService } from "@/lib/security/audit";

// SecurityAuditService is a static class, no need to instantiate

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method === "GET") {
      // Get user's MFA devices
      const devices = await prisma.mFADevice.findMany({
        where: {
          userId,
          verified: true,
        },
        select: {
          id: true,
          type: true,
          phoneNumber: true,
          verified: true,
          lastUsed: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        devices: devices.map((device) => ({
          ...device,
          phoneNumber: device.phoneNumber
            ? `***-***-${device.phoneNumber.slice(-4)}`
            : null,
        })),
      });
    } else if (req.method === "DELETE") {
      // Remove MFA device
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }

      const device = await prisma.mFADevice.findFirst({
        where: {
          id: deviceId,
          userId,
        },
      });

      if (!device) {
        return res.status(404).json({ message: "MFA device not found" });
      }

      await prisma.mFADevice.delete({
        where: { id: deviceId },
      });

      // Log device removal
      await SecurityAuditService.logSecurityEvent(
        "mfa_device_removed",
        "medium",
        "MFA Device Removed",
        `MFA device ${deviceId} removed`,
        userId,
        undefined,
        { type: device.type, deviceId },
      );

      res.status(200).json({ message: "MFA device removed successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("MFA devices error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
