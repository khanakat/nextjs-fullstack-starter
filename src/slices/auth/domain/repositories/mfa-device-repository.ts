import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { MfaDevice, MfaDeviceType } from '../entities/mfa-device';

/**
 * MFA Device Repository Interface
 * Contract for MFA device data access
 */
export interface IMfaDeviceRepository {
  /**
   * Find device by ID
   */
  findById(id: UniqueId): Promise<MfaDevice | null>;

  /**
   * Find all devices for a user
   */
  findByUserId(userId: UniqueId): Promise<MfaDevice[]>;

  /**
   * Find enabled devices for a user
   */
  findEnabledByUserId(userId: UniqueId): Promise<MfaDevice[]>;

  /**
   * Find device by type for a user
   */
  findByUserIdAndType(userId: UniqueId, type: MfaDeviceType): Promise<MfaDevice | null>;

  /**
   * Find primary MFA device for a user
   */
  findPrimaryByUserId(userId: UniqueId): Promise<MfaDevice | null>;

  /**
   * Save new device
   */
  save(device: MfaDevice): Promise<MfaDevice>;

  /**
   * Update existing device
   */
  update(device: MfaDevice): Promise<MfaDevice>;

  /**
   * Delete device
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Delete all devices for a user
   */
  deleteByUserId(userId: UniqueId): Promise<void>;

  /**
   * Count devices by user
   */
  countByUserId(userId: UniqueId): Promise<number>;

  /**
   * Count enabled devices by user
   */
  countEnabledByUserId(userId: UniqueId): Promise<number>;

  /**
   * Get total device count
   */
  count(): Promise<number>;

  /**
   * Find all devices with pagination
   */
  findAll(limit?: number, offset?: number): Promise<MfaDevice[]>;

  /**
   * Disable all devices for a user
   */
  disableAllForUser(userId: UniqueId): Promise<number>;
}
