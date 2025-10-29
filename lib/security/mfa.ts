import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { Twilio } from "twilio";

// MFA Service for handling multi-factor authentication
export class MFAService {
  private static twilioClient: Twilio | null = null;

  // Initialize Twilio client for SMS
  static initTwilio() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = new Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
    }
  }

  // Generate TOTP secret for a user
  static generateTOTPSecret(
    userEmail: string,
    serviceName: string = "NextJS App",
  ): {
    secret: string;
    otpauthUrl: string;
  } {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: serviceName,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || "",
    };
  }

  // Generate QR code for TOTP setup
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  // Verify TOTP token
  static verifyTOTP(
    token: string,
    secret: string,
    window: number = 2,
  ): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: window,
    });
  }

  // Generate backup codes
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Send SMS verification code
  static async sendSMSCode(
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    if (!this.twilioClient) {
      this.initTwilio();
    }

    if (!this.twilioClient) {
      console.error("Twilio client not initialized");
      return false;
    }

    try {
      await this.twilioClient.messages.create({
        body: `Your verification code is: ${code}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      return true;
    } catch (error) {
      console.error("Error sending SMS:", error);
      return false;
    }
  }

  // Generate SMS verification code
  static generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Verify backup code
  static verifyBackupCode(
    code: string,
    backupCodes: string[],
    usedCodes: string[],
  ): boolean {
    const normalizedCode = code.toUpperCase().trim();

    // Check if code exists in backup codes and hasn't been used
    if (
      backupCodes.includes(normalizedCode) &&
      !usedCodes.includes(normalizedCode)
    ) {
      return true;
    }

    return false;
  }

  // Mark backup code as used
  static markBackupCodeAsUsed(code: string, usedCodes: string[]): string[] {
    const normalizedCode = code.toUpperCase().trim();
    if (!usedCodes.includes(normalizedCode)) {
      usedCodes.push(normalizedCode);
    }
    return usedCodes;
  }

  // Check if MFA is required for user
  static isMFARequired(
    userRoles: string[],
    organizationPolicies: any[],
  ): boolean {
    // Check if user has admin roles
    const adminRoles = ["admin", "owner", "super_admin"];
    const hasAdminRole = userRoles.some((role) => adminRoles.includes(role));

    if (hasAdminRole) {
      return true;
    }

    // Check organization policies
    const mfaPolicy = organizationPolicies.find(
      (policy) => policy.type === "MFA",
    );
    if (mfaPolicy && mfaPolicy.enforcement === "enforced") {
      return true;
    }

    return false;
  }

  // Generate recovery codes for account recovery
  static generateRecoveryCodes(count: number = 5): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate longer recovery codes (16 characters)
      const code = Math.random().toString(36).substring(2, 18).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Validate phone number format
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Basic international phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  // Rate limiting for MFA attempts
  static isRateLimited(
    attempts: number,
    _timeWindow: number,
    maxAttempts: number = 5,
  ): boolean {
    return attempts >= maxAttempts;
  }
}

// MFA Token Cache for temporary storage
export class MFATokenCache {
  private static cache: Map<
    string,
    { code: string; expires: number; attempts: number }
  > = new Map();

  // Store SMS code temporarily
  static storeSMSCode(
    userId: string,
    code: string,
    expiryMinutes: number = 5,
  ): void {
    const expires = Date.now() + expiryMinutes * 60 * 1000;
    this.cache.set(`sms_${userId}`, { code, expires, attempts: 0 });
  }

  // Verify SMS code
  static verifySMSCode(userId: string, code: string): boolean {
    const key = `sms_${userId}`;
    const cached = this.cache.get(key);

    if (!cached) {
      return false;
    }

    // Check if expired
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return false;
    }

    // Increment attempts
    cached.attempts++;

    // Check rate limiting
    if (cached.attempts > 3) {
      this.cache.delete(key);
      return false;
    }

    // Verify code
    if (cached.code === code) {
      this.cache.delete(key);
      return true;
    }

    return false;
  }

  // Clean expired codes
  static cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }
}
