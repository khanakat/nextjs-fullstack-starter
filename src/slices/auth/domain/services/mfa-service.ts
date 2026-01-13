import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { MfaDevice, MfaDeviceType } from '../entities/mfa-device';
import { MfaCode } from '../value-objects/mfa-code';

/**
 * MFA Service Interface
 * Contract for multi-factor authentication operations
 */
export interface IMfaService {
  /**
   * Generate TOTP secret
   */
  generateTotpSecret(): Promise<string>;

  /**
   * Generate TOTP code
   */
  generateTotpCode(secret: string): string;

  /**
   * Verify TOTP code
   */
  verifyTotpCode(secret: string, code: string): Promise<boolean>;

  /**
   * Generate SMS code
   */
  generateSmsCode(phoneNumber: string): Promise<MfaCode>;

  /**
   * Send SMS code
   */
  sendSmsCode(phoneNumber: string, code: MfaCode): Promise<void>;

  /**
   * Verify SMS code
   */
  verifySmsCode(phoneNumber: string, code: MfaCode): Promise<boolean>;

  /**
   * Generate backup codes
   */
  generateBackupCodes(count?: number): MfaCode[];

  /**
   * Enable MFA for user
   */
  enableMfa(
    userId: UniqueId,
    type: MfaDeviceType,
    secret?: string,
    phoneNumber?: string,
    backupCodes?: MfaCode[]
  ): Promise<MfaDevice>;

  /**
   * Disable MFA for user
   */
  disableMfa(userId: UniqueId, deviceId: UniqueId): Promise<void>;

  /**
   * Verify MFA code
   */
  verifyMfaCode(userId: UniqueId, code: MfaCode): Promise<boolean>;

  /**
   * Get MFA device
   */
  getMfaDevice(userId: UniqueId, deviceId: UniqueId): Promise<MfaDevice | null>;

  /**
   * Get all MFA devices for user
   */
  getMfaDevices(userId: UniqueId): Promise<MfaDevice[]>;

  /**
   * Remove MFA device
   */
  removeMfaDevice(userId: UniqueId, deviceId: UniqueId): Promise<void>;
}
