import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { MFAService, MFATokenCache } from "@/lib/security/mfa";
import { SecurityAuditService } from "@/lib/security/audit";

// MFAService and SecurityAuditService are static classes, no need to instantiate

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { deviceId, code, type } = req.body;

    if (!deviceId || !code || !type) {
      return res
        .status(400)
        .json({ message: "Device ID, code, and type are required" });
    }

    // Get the MFA device
    const device = await prisma.mFADevice.findFirst({
      where: {
        id: deviceId,
        userId,
        type,
      },
    });

    if (!device) {
      return res.status(404).json({ message: "MFA device not found" });
    }

    let isValid = false;

    if (type === "totp") {
      if (!device.secret) {
        return res.status(400).json({ message: "TOTP secret not found" });
      }
      isValid = MFAService.verifyTOTP(code, device.secret);
    } else if (type === "sms") {
      if (!device.phoneNumber) {
        return res.status(400).json({ message: "Phone number not found" });
      }
      // For SMS, we need to use MFATokenCache to verify the code
      isValid = MFATokenCache.verifySMSCode(userId, code);
    } else {
      return res.status(400).json({ message: "Invalid MFA type" });
    }

    if (!isValid) {
      // Log failed verification
      await SecurityAuditService.logSecurityEvent(
        "mfa_verification_failed",
        "high",
        "MFA Verification Failed",
        `MFA verification failed for device ${deviceId}`,
        userId,
        (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
        { type, reason: "invalid_code", deviceId },
      );

      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Mark device as verified and generate backup codes
    const backupCodes = MFAService.generateBackupCodes();

    await prisma.mFADevice.update({
      where: { id: deviceId },
      data: {
        verified: true,
        backupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date(),
      },
    });

    // Log successful verification
    await SecurityAuditService.logSecurityEvent(
      "mfa_verification_success",
      "low",
      "MFA Verification Success",
      `MFA verification successful for device ${deviceId}`,
      userId,
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      { type, deviceId },
    );

    res.status(200).json({
      message: "MFA verification successful",
      data: {
        deviceId,
        verified: true,
        backupCodes,
        message: "Please save these backup codes in a secure location",
      },
    });
  } catch (error) {
    console.error("MFA verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
