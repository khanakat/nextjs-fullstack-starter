import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { MFAService } from "@/lib/security/mfa";
import { SecurityAuditService } from "@/lib/security/audit";

// All services are static classes, no need to instantiate

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method === "POST") {
      // Generate new backup codes
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }

      const device = await prisma.mFADevice.findFirst({
        where: {
          id: deviceId,
          userId,
          verified: true,
        },
      });

      if (!device) {
        return res.status(404).json({ message: "MFA device not found" });
      }

      const newBackupCodes = MFAService.generateBackupCodes();

      await prisma.mFADevice.update({
        where: { id: deviceId },
        data: {
          backupCodes: JSON.stringify(newBackupCodes),
          updatedAt: new Date(),
        },
      });

      // Log backup codes regeneration
      await SecurityAuditService.logSecurityEvent(
        "mfa_backup_codes_regenerated",
        "medium",
        "MFA Backup Codes Regenerated",
        `Backup codes regenerated for MFA device ${deviceId}`,
        userId,
        undefined,
        { type: device.type, deviceId },
      );

      res.status(200).json({
        message: "New backup codes generated",
        backupCodes: newBackupCodes,
      });
    } else if (req.method === "PUT") {
      // Use backup code
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Backup code is required" });
      }

      // Find device with this backup code
      const devices = await prisma.mFADevice.findMany({
        where: {
          userId,
          verified: true,
          backupCodes: {
            contains: code,
          },
        },
      });

      if (devices.length === 0) {
        // Log failed backup code usage
        await SecurityAuditService.logSecurityEvent(
          "mfa_backup_code_failed",
          "high",
          "MFA Backup Code Failed",
          "Invalid backup code attempted",
          userId,
          undefined,
          { reason: "invalid_code" },
        );

        return res.status(400).json({ message: "Invalid backup code" });
      }

      const device = devices[0];

      // Parse backup codes and remove used code
      const currentBackupCodes = device.backupCodes
        ? JSON.parse(device.backupCodes)
        : [];
      const updatedBackupCodes = currentBackupCodes.filter(
        (c: string) => c !== code,
      );

      await prisma.mFADevice.update({
        where: { id: device.id },
        data: {
          backupCodes: JSON.stringify(updatedBackupCodes),
          lastUsed: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log successful backup code usage
      await SecurityAuditService.logSecurityEvent(
        "mfa_backup_code_used",
        "low",
        "MFA Backup Code Used",
        `Backup code used for MFA device ${device.id}`,
        userId,
        undefined,
        {
          type: device.type,
          remainingCodes: updatedBackupCodes.length,
          deviceId: device.id,
        },
      );

      res.status(200).json({
        message: "Backup code verified successfully",
        remainingCodes: updatedBackupCodes.length,
        warning:
          updatedBackupCodes.length <= 2
            ? "You have few backup codes remaining. Consider generating new ones."
            : null,
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("MFA backup codes error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
