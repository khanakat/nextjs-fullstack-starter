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

    const { type, phoneNumber } = req.body;

    if (!type || !["totp", "sms"].includes(type)) {
      return res.status(400).json({ message: "Invalid MFA type" });
    }

    if (type === "sms" && !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Phone number required for SMS MFA" });
    }

    // Check if user already has this MFA type
    const existingDevice = await prisma.mFADevice.findFirst({
      where: {
        userId,
        type,
        verified: true,
      },
    });

    if (existingDevice) {
      return res
        .status(400)
        .json({ message: `${type.toUpperCase()} MFA already enabled` });
    }

    let setupData;

    if (type === "totp") {
      // Get user email first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate TOTP secret and QR code
      const totpData = MFAService.generateTOTPSecret(user.email);
      const qrCode = await MFAService.generateQRCode(totpData.otpauthUrl);

      // Store unverified device
      const device = await prisma.mFADevice.create({
        data: {
          userId,
          type: "totp",
          secret: totpData.secret,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      setupData = {
        deviceId: device.id,
        secret: totpData.secret,
        qrCode,
        manualEntryKey: totpData.secret,
      };

      // Log audit event
      await SecurityAuditService.logSecurityEvent(
        "mfa_setup_initiated",
        "medium",
        "MFA Setup Initiated",
        `TOTP MFA setup initiated for device ${device.id}`,
        userId,
        undefined,
        { type: "totp", deviceId: device.id },
      );
    } else if (type === "sms") {
      // Validate phone number
      if (!MFAService.validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }

      // Store unverified device
      const device = await prisma.mFADevice.create({
        data: {
          userId,
          type: "sms",
          phoneNumber,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Generate and send verification SMS
      const verificationCode = MFAService.generateSMSCode();
      await MFAService.sendSMSCode(phoneNumber, verificationCode);

      // Store the code in cache for verification
      MFATokenCache.storeSMSCode(userId, verificationCode);

      setupData = {
        deviceId: device.id,
        phoneNumber,
        message: "Verification code sent to your phone",
      };

      // Log audit event
      await SecurityAuditService.logSecurityEvent(
        "mfa_setup_initiated",
        "medium",
        "MFA Setup Initiated",
        `SMS MFA setup initiated for device ${device.id}`,
        userId,
        undefined,
        { type: "sms", phoneNumber, deviceId: device.id },
      );
    }

    res.status(200).json({
      message: "MFA setup initiated",
      data: setupData,
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
