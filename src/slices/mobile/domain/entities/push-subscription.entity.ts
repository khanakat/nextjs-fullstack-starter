/**
 * Push Subscription Entity
 * Represents a push notification subscription for a device
 */

export interface PushSubscriptionInfo {
  id: string;
  userId: string;
  organizationId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceId: string | null;
  deviceType: string | null;
  browserName: string | null;
  browserVersion: string | null;
  platform: string | null;
  userAgent: string | null;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PushSubscription {
  constructor(private props: PushSubscriptionInfo) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get organizationId(): string | null {
    return this.props.organizationId;
  }

  get endpoint(): string {
    return this.props.endpoint;
  }

  get p256dh(): string {
    return this.props.p256dh;
  }

  get auth(): string {
    return this.props.auth;
  }

  get deviceId(): string | null {
    return this.props.deviceId;
  }

  get deviceType(): string | null {
    return this.props.deviceType;
  }

  get browserName(): string | null {
    return this.props.browserName;
  }

  get browserVersion(): string | null {
    return this.props.browserVersion;
  }

  get platform(): string | null {
    return this.props.platform;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get subscribedAt(): Date {
    return this.props.subscribedAt;
  }

  get unsubscribedAt(): Date | null {
    return this.props.unsubscribedAt;
  }

  get lastUsed(): Date | null {
    return this.props.lastUsed;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  unsubscribe(): void {
    this.props.isActive = false;
    this.props.unsubscribedAt = new Date();
    this.props.updatedAt = new Date();
  }

  resubscribe(): void {
    this.props.isActive = true;
    this.props.unsubscribedAt = null;
    this.props.updatedAt = new Date();
  }

  markAsUsed(): void {
    this.props.lastUsed = new Date();
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      organizationId: this.props.organizationId,
      endpoint: this.props.endpoint,
      p256dh: this.props.p256dh,
      auth: this.props.auth,
      deviceId: this.props.deviceId,
      deviceType: this.props.deviceType,
      browserName: this.props.browserName,
      browserVersion: this.props.browserVersion,
      platform: this.props.platform,
      userAgent: this.props.userAgent,
      isActive: this.props.isActive,
      subscribedAt: this.props.subscribedAt,
      unsubscribedAt: this.props.unsubscribedAt,
      lastUsed: this.props.lastUsed,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
