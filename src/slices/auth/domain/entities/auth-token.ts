import { Entity } from '../../../../shared/domain/base/entity';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { Token } from '../value-objects/token';

/**
 * Auth Token Type Enum
 */
export enum AuthTokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  RESET_PASSWORD = 'RESET_PASSWORD',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
}

/**
 * Auth Token Props Interface
 */
export interface AuthTokenProps {
  userId: UniqueId;
  token: Token;
  type: AuthTokenType;
  expiresAt: Date;
  usedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Auth Token Domain Events
 */
class AuthTokenCreatedEvent extends DomainEvent {
  constructor(tokenId: string, userId: string, type: AuthTokenType) {
    super();
    Object.assign(this, { tokenId, userId, type });
  }

  getEventName(): string {
    return 'AuthTokenCreated';
  }
}

class AuthTokenUsedEvent extends DomainEvent {
  constructor(tokenId: string, userId: string, type: AuthTokenType) {
    super();
    Object.assign(this, { tokenId, userId, type });
  }

  getEventName(): string {
    return 'AuthTokenUsed';
  }
}

class AuthTokenExpiredEvent extends DomainEvent {
  constructor(tokenId: string, userId: string, type: AuthTokenType) {
    super();
    Object.assign(this, { tokenId, userId, type });
  }

  getEventName(): string {
    return 'AuthTokenExpired';
  }
}

/**
 * Auth Token Entity
 * Represents an authentication token
 */
export class AuthToken extends Entity<UniqueId> {
  private constructor(private props: AuthTokenProps, id?: UniqueId) {
    super(id || UniqueId.create());
  }

  // Getters
  get userId(): UniqueId {
    return this.props.userId;
  }

  get token(): Token {
    return this.props.token;
  }

  get type(): AuthTokenType {
    return this.props.type;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get usedAt(): Date | undefined {
    return this.props.usedAt;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  // Business Methods

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if token is used
   */
  isUsed(): boolean {
    return this.props.usedAt !== undefined;
  }

  /**
   * Check if token is valid
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  /**
   * Mark token as used
   */
  markAsUsed(): void {
    if (this.isUsed()) {
      return; // Already used
    }

    this.props.usedAt = new Date();
    this.addDomainEvent(new AuthTokenUsedEvent(
      this.id.value,
      this.props.userId.value,
      this.props.type
    ));
  }

  /**
   * Mark token as expired
   */
  markAsExpired(): void {
    if (this.isExpired()) {
      return; // Already expired
    }

    this.addDomainEvent(new AuthTokenExpiredEvent(
      this.id.value,
      this.props.userId.value,
      this.props.type
    ));
  }

  /**
   * Check if token is an access token
   */
  isAccessToken(): boolean {
    return this.props.type === AuthTokenType.ACCESS;
  }

  /**
   * Check if token is a refresh token
   */
  isRefreshToken(): boolean {
    return this.props.type === AuthTokenType.REFRESH;
  }

  /**
   * Check if token is a password reset token
   */
  isPasswordResetToken(): boolean {
    return this.props.type === AuthTokenType.RESET_PASSWORD;
  }

  /**
   * Check if token is an email verification token
   */
  isEmailVerificationToken(): boolean {
    return this.props.type === AuthTokenType.EMAIL_VERIFICATION;
  }

  /**
   * Get time until expiry
   */
  getTimeUntilExpiry(): number {
    const now = new Date();
    const expiryTime = this.props.expiresAt.getTime();
    const currentTime = now.getTime();
    return Math.max(0, expiryTime - currentTime);
  }

  /**
   * Get time until expiry in minutes
   */
  getTimeUntilExpiryInMinutes(): number {
    return Math.floor(this.getTimeUntilExpiry() / (60 * 1000));
  }

  /**
   * Create a new Auth Token (factory method)
   */
  static create(props: AuthTokenProps): AuthToken {
    const token = new AuthToken(props);
    token.addDomainEvent(new AuthTokenCreatedEvent(
      token.id.value,
      props.userId.value,
      props.type
    ));
    return token;
  }

  /**
   * Reconstitute Auth Token from persistence (factory method)
   */
  static reconstitute(id: UniqueId, props: AuthTokenProps): AuthToken {
    return new AuthToken(props, id);
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      userId: this.props.userId.value,
      token: this.props.token.toString(),
      type: this.props.type,
      expiresAt: this.props.expiresAt,
      usedAt: this.props.usedAt,
      ipAddress: this.props.ipAddress,
      userAgent: this.props.userAgent,
    };
  }
}
