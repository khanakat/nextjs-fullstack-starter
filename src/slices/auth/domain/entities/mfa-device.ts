import { Entity } from '../../../../shared/domain/base/entity';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { MfaCode } from '../value-objects/mfa-code';

/**
 * MFA Device Type Enum
 */
export enum MfaDeviceType {
  TOTP = 'TOTP',
  SMS = 'SMS',
  BACKUP_CODES = 'BACKUP_CODES',
}

/**
 * MFA Device Props Interface
 */
export interface MfaDeviceProps {
  userId: UniqueId;
  type: MfaDeviceType;
  name?: string;
  secret?: string;
  phoneNumber?: string;
  backupCodes?: MfaCode[];
  verified: boolean;
  enabled: boolean;
  lastUsedAt?: Date;
}

/**
 * MFA Device Domain Events
 */
class MfaDeviceCreatedEvent extends DomainEvent {
  constructor(deviceId: string, userId: string, type: MfaDeviceType) {
    super();
    Object.assign(this, { deviceId, userId, type });
  }

  getEventName(): string {
    return 'MfaDeviceCreated';
  }
}

class MfaDeviceVerifiedEvent extends DomainEvent {
  constructor(deviceId: string, userId: string) {
    super();
    Object.assign(this, { deviceId, userId });
  }

  getEventName(): string {
    return 'MfaDeviceVerified';
  }
}

class MfaDeviceDisabledEvent extends DomainEvent {
  constructor(deviceId: string, userId: string) {
    super();
    Object.assign(this, { deviceId, userId });
  }

  getEventName(): string {
    return 'MfaDeviceDisabled';
  }
}

class MfaDeviceUsedEvent extends DomainEvent {
  constructor(deviceId: string, userId: string) {
    super();
    Object.assign(this, { deviceId, userId });
  }

  getEventName(): string {
    return 'MfaDeviceUsed';
  }
}

/**
 * MFA Device Entity
 * Represents a multi-factor authentication device
 */
export class MfaDevice extends Entity<UniqueId> {
  private constructor(private props: MfaDeviceProps, id?: UniqueId) {
    super(id || UniqueId.create());
  }

  // Getters
  get userId(): UniqueId {
    return this.props.userId;
  }

  get type(): MfaDeviceType {
    return this.props.type;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get secret(): string | undefined {
    return this.props.secret;
  }

  get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  get backupCodes(): MfaCode[] | undefined {
    return this.props.backupCodes;
  }

  get verified(): boolean {
    return this.props.verified;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get lastUsedAt(): Date | undefined {
    return this.props.lastUsedAt;
  }

  // Business Methods

  /**
   * Verify MFA device
   */
  verify(): void {
    if (this.props.verified) {
      return; // Already verified
    }

    this.props.verified = true;
    this.addDomainEvent(new MfaDeviceVerifiedEvent(
      this.id.value,
      this.props.userId.value
    ));
  }

  /**
   * Disable MFA device
   */
  disable(): void {
    if (!this.props.enabled) {
      return; // Already disabled
    }

    this.props.enabled = false;
    this.addDomainEvent(new MfaDeviceDisabledEvent(
      this.id.value,
      this.props.userId.value
    ));
  }

  /**
   * Enable MFA device
   */
  enable(): void {
    if (this.props.enabled) {
      return; // Already enabled
    }

    if (!this.props.verified) {
      throw new Error('Cannot enable unverified MFA device');
    }

    this.props.enabled = true;
  }

  /**
   * Use a backup code
   */
  useBackupCode(code: MfaCode): void {
    if (this.props.type !== MfaDeviceType.BACKUP_CODES) {
      throw new Error('This device does not use backup codes');
    }

    if (!this.props.backupCodes) {
      throw new Error('No backup codes available');
    }

    const codeIndex = this.props.backupCodes.findIndex(c => c.equals(code));
    if (codeIndex === -1) {
      throw new Error('Invalid backup code');
    }

    // Remove used code
    this.props.backupCodes = this.props.backupCodes.filter((_, index) => index !== codeIndex);
    this.props.lastUsedAt = new Date();
    this.addDomainEvent(new MfaDeviceUsedEvent(
      this.id.value,
      this.props.userId.value
    ));
  }

  /**
   * Record MFA usage
   */
  recordUsage(): void {
    this.props.lastUsedAt = new Date();
    this.addDomainEvent(new MfaDeviceUsedEvent(
      this.id.value,
      this.props.userId.value
    ));
  }

  /**
   * Check if device is a TOTP device
   */
  isTotp(): boolean {
    return this.props.type === MfaDeviceType.TOTP;
  }

  /**
   * Check if device is an SMS device
   */
  isSms(): boolean {
    return this.props.type === MfaDeviceType.SMS;
  }

  /**
   * Check if device uses backup codes
   */
  isBackupCodes(): boolean {
    return this.props.type === MfaDeviceType.BACKUP_CODES;
  }

  /**
   * Check if device is verified
   */
  isVerified(): boolean {
    return this.props.verified;
  }

  /**
   * Check if device is enabled
   */
  isEnabled(): boolean {
    return this.props.enabled;
  }

  /**
   * Get remaining backup codes count
   */
  getRemainingBackupCodesCount(): number {
    return this.props.backupCodes?.length || 0;
  }

  /**
   * Create a new MFA Device (factory method)
   */
  static create(props: MfaDeviceProps): MfaDevice {
    const device = new MfaDevice(props);
    device.addDomainEvent(new MfaDeviceCreatedEvent(
      device.id.value,
      props.userId.value,
      props.type
    ));
    return device;
  }

  /**
   * Reconstitute MfaDevice from persistence (factory method)
   */
  static reconstitute(id: UniqueId, props: MfaDeviceProps): MfaDevice {
    return new MfaDevice(props, id);
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      userId: this.props.userId.value,
      type: this.props.type,
      name: this.props.name,
      secret: this.props.secret,
      phoneNumber: this.props.phoneNumber,
      backupCodes: this.props.backupCodes?.map(c => c.toString()),
      verified: this.props.verified,
      enabled: this.props.enabled,
      lastUsedAt: this.props.lastUsedAt,
    };
  }
}
