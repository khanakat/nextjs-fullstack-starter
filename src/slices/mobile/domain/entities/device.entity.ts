/**
 * Device Entity
 * Represents a mobile or desktop device registered to a user
 */

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export interface DeviceCapabilities {
  pushNotifications: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;
  webShare: boolean;
  geolocation: boolean;
  camera: boolean;
  vibration: boolean;
  touchScreen: boolean;
  orientation: boolean;
}

export interface DeviceInfo {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: DeviceType;
  platform: string;
  browserName: string;
  browserVersion: string;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  capabilities: DeviceCapabilities;
  timezone: string;
  language: string;
  isActive: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Device {
  constructor(private props: DeviceInfo) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get deviceId(): string {
    return this.props.deviceId;
  }

  get deviceType(): DeviceType {
    return this.props.deviceType;
  }

  get platform(): string {
    return this.props.platform;
  }

  get browserName(): string {
    return this.props.browserName;
  }

  get browserVersion(): string {
    return this.props.browserVersion;
  }

  get screenWidth(): number {
    return this.props.screenWidth;
  }

  get screenHeight(): number {
    return this.props.screenHeight;
  }

  get userAgent(): string {
    return this.props.userAgent;
  }

  get capabilities(): DeviceCapabilities {
    return this.props.capabilities;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get language(): string {
    return this.props.language;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get lastSeen(): Date {
    return this.props.lastSeen;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateLastSeen(): void {
    this.props.lastSeen = new Date();
    this.props.updatedAt = new Date();
  }

  updateCapabilities(capabilities: DeviceCapabilities): void {
    this.props.capabilities = capabilities;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      deviceId: this.props.deviceId,
      deviceType: this.props.deviceType,
      platform: this.props.platform,
      browserName: this.props.browserName,
      browserVersion: this.props.browserVersion,
      screenWidth: this.props.screenWidth,
      screenHeight: this.props.screenHeight,
      userAgent: this.props.userAgent,
      capabilities: this.props.capabilities,
      timezone: this.props.timezone,
      language: this.props.language,
      isActive: this.props.isActive,
      lastSeen: this.props.lastSeen,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
