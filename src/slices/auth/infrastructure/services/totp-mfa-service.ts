import { injectable, inject } from 'inversify';
import { IMfaService } from '../../domain/services/mfa-service';
import type { IMfaDeviceRepository } from '../../domain/repositories/mfa-device-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { MfaDevice, MfaDeviceType } from '../../domain/entities/mfa-device';
import { MfaCode } from '../../domain/value-objects/mfa-code';
import { TYPES } from '@/shared/infrastructure/di/types';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

/**
 * TOTP MFA Service
 * 
 * Implementation of IMfaService using TOTP (Time-based One-Time Password)
 * for multi-factor authentication. TOTP codes are generated based on
 * a shared secret and the current time, changing every 30 seconds.
 * 
 * @see https://en.wikipedia.org/wiki/Time-based_One-time_Password_algorithm
 */
@injectable()
export class TotpMfaService implements IMfaService {
  private readonly SMS_CODE_LENGTH = 6;
  private readonly SMS_CODE_EXPIRY_MINUTES = 5;
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;

  constructor(
    @inject(TYPES.MfaDeviceRepository) private readonly mfaDeviceRepository: IMfaDeviceRepository
  ) {}

  /**
   * Generate TOTP secret
   * 
   * Generates a base32-encoded secret key for TOTP authentication.
   * This secret should be shared with the user via QR code for
   * authenticator apps like Google Authenticator, Authy, etc.
   */
  async generateTotpSecret(): Promise<string> {
    const secret = speakeasy.generateSecret({
      name: 'NextJS App',
      issuer: 'NextJS',
    });
    return secret.base32;
  }

  /**
   * Generate TOTP code
   * 
   * Generates a TOTP code for the given secret and current time.
   * This is primarily used for testing purposes.
   */
  generateTotpCode(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  }

  /**
   * Verify TOTP code
   * 
   * Verifies a TOTP code against the secret.
   * Includes a 1-window tolerance to account for clock drift.
   */
  async verifyTotpCode(secret: string, code: string): Promise<boolean> {
    const result = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1, // Allow 1 window before and after for clock drift
    });
    return result;
  }

  /**
   * Generate SMS code
   * 
   * Generates a random numeric code for SMS-based MFA.
   * The code is typically 6 digits and expires after a few minutes.
   */
  async generateSmsCode(phoneNumber: string): Promise<MfaCode> {
    const code = Array.from({ length: this.SMS_CODE_LENGTH })
      .map(() => Math.floor(Math.random() * 10))
      .join('');
    return new MfaCode(code);
  }

  /**
   * Send SMS code
   * 
   * Sends the MFA code to the user's phone number.
   * Note: This requires an SMS service integration (Twilio, AWS SNS, etc.).
   * For now, this is a placeholder implementation.
   */
  async sendSmsCode(phoneNumber: string, code: MfaCode): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // For development/testing, log the code
    console.log(`[MFA] SMS code sent to ${phoneNumber}: ${code.toString()}`);
  }

  /**
   * Verify SMS code
   * 
   * Verifies an SMS code against the stored code.
   * Note: This requires storing the SMS code temporarily with expiration.
   */
  async verifySmsCode(phoneNumber: string, code: MfaCode): Promise<boolean> {
    // TODO: Implement SMS code verification with temporary storage
    // For now, return false
    return false;
  }

  /**
   * Generate backup codes
   * 
   * Generates a set of one-time backup codes that can be used
   * if the user loses access to their primary MFA device.
   */
  generateBackupCodes(count: number = this.BACKUP_CODES_COUNT): MfaCode[] {
    const codes: MfaCode[] = [];
    const usedCodes = new Set<string>();

    for (let i = 0; i < count; i++) {
      let code: string;
      do {
        code = Array.from({ length: this.BACKUP_CODE_LENGTH })
          .map(() => Math.floor(Math.random() * 10))
          .join('');
      } while (usedCodes.has(code));

      usedCodes.add(code);
      codes.push(new MfaCode(code));
    }

    return codes;
  }

  /**
   * Enable MFA for user
   * 
   * Creates a new MFA device for the user with the specified type.
   * For TOTP, the secret is stored securely. For SMS, the phone number
   * is stored. For backup codes, they are generated and stored.
   */
  async enableMfa(
    userId: UniqueId,
    type: MfaDeviceType,
    secret?: string,
    phoneNumber?: string,
    backupCodes?: MfaCode[]
  ): Promise<MfaDevice> {
    // Check if user already has MFA enabled
    const existingDevices = await this.mfaDeviceRepository.findEnabledByUserId(userId);
    if (existingDevices.length > 0) {
      throw new Error('MFA is already enabled for this user');
    }

    const device = MfaDevice.create({
      userId,
      type,
      name: this.getDeviceName(type),
      secret,
      phoneNumber,
      backupCodes,
      verified: false,
      enabled: false,
    });

    return await this.mfaDeviceRepository.save(device);
  }

  /**
   * Disable MFA for user
   * 
   * Disables the specified MFA device for the user.
   * If this is the only MFA device, the user will lose MFA protection.
   */
  async disableMfa(userId: UniqueId, deviceId: UniqueId): Promise<void> {
    const device = await this.mfaDeviceRepository.findById(deviceId);
    if (!device) {
      throw new Error('MFA device not found');
    }

    if (!device.userId.equals(userId)) {
      throw new Error('MFA device does not belong to user');
    }

    device.disable();
    await this.mfaDeviceRepository.update(device);
  }

  /**
   * Verify MFA code
   * 
   * Verifies an MFA code against the user's enabled MFA devices.
   * Supports TOTP, SMS, and backup codes.
   */
  async verifyMfaCode(userId: UniqueId, code: MfaCode): Promise<boolean> {
    const devices = await this.mfaDeviceRepository.findEnabledByUserId(userId);
    if (devices.length === 0) {
      throw new Error('MFA is not enabled for this user');
    }

    for (const device of devices) {
      if (device.type === MfaDeviceType.TOTP && device.secret) {
        const isValid = await this.verifyTotpCode(device.secret, code.toString());
        if (isValid) {
          return true;
        }
      } else if (device.type === MfaDeviceType.SMS) {
        const isValid = await this.verifySmsCode(device.phoneNumber || '', code);
        if (isValid) {
          return true;
        }
      } else if (device.type === MfaDeviceType.BACKUP_CODES && device.backupCodes) {
        const isValid = device.backupCodes.some(c => c.equals(code));
        if (isValid) {
          // Use the backup code
          device.useBackupCode(code);
          await this.mfaDeviceRepository.update(device);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get MFA device
   * 
   * Retrieves a specific MFA device for the user.
   */
  async getMfaDevice(userId: UniqueId, deviceId: UniqueId): Promise<MfaDevice | null> {
    const device = await this.mfaDeviceRepository.findById(deviceId);
    if (!device || !device.userId.equals(userId)) {
      return null;
    }
    return device;
  }

  /**
   * Get all MFA devices for user
   * 
   * Retrieves all MFA devices for the user.
   */
  async getMfaDevices(userId: UniqueId): Promise<MfaDevice[]> {
    return await this.mfaDeviceRepository.findByUserId(userId);
  }

  /**
   * Remove MFA device
   * 
   * Removes an MFA device for the user.
   */
  async removeMfaDevice(userId: UniqueId, deviceId: UniqueId): Promise<void> {
    const device = await this.mfaDeviceRepository.findById(deviceId);
    if (!device) {
      throw new Error('MFA device not found');
    }

    if (!device.userId.equals(userId)) {
      throw new Error('MFA device does not belong to user');
    }

    await this.mfaDeviceRepository.delete(deviceId);
  }

  /**
   * Get a user-friendly device name
   * 
   * Returns a default name for the MFA device based on its type.
   */
  private getDeviceName(type: MfaDeviceType): string {
    switch (type) {
      case MfaDeviceType.TOTP:
        return 'Authenticator App';
      case MfaDeviceType.SMS:
        return 'SMS Verification';
      case MfaDeviceType.BACKUP_CODES:
        return 'Backup Codes';
      default:
        return 'MFA Device';
    }
  }
}
