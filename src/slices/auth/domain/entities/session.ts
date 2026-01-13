import { Entity } from '../../../../shared/domain/base/entity';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { AuthSessionId } from '../value-objects/auth-session-id';
import { Token } from '../value-objects/token';

/**
 * Session Type Enum
 */
export enum SessionType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  API = 'API',
}

/**
 * Session Status Enum
 */
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/**
 * Session Props Interface
 */
export interface SessionProps {
  userId: UniqueId;
  sessionId: AuthSessionId;
  accessToken: Token;
  refreshToken?: Token;
  type: SessionType;
  status: SessionStatus;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  lastActivityAt: Date;
}

/**
 * Session Domain Events
 */
class SessionCreatedEvent extends DomainEvent {
  constructor(sessionId: string, userId: string, type: SessionType) {
    super();
    Object.assign(this, { sessionId, userId, type });
  }

  getEventName(): string {
    return 'SessionCreated';
  }
}

class SessionExpiredEvent extends DomainEvent {
  constructor(sessionId: string, userId: string) {
    super();
    Object.assign(this, { sessionId, userId });
  }

  getEventName(): string {
    return 'SessionExpired';
  }
}

class SessionRevokedEvent extends DomainEvent {
  constructor(sessionId: string, userId: string, reason?: string) {
    super();
    Object.assign(this, { sessionId, userId, reason });
  }

  getEventName(): string {
    return 'SessionRevoked';
  }
}

class SessionRefreshedEvent extends DomainEvent {
  constructor(sessionId: string, userId: string) {
    super();
    Object.assign(this, { sessionId, userId });
  }

  getEventName(): string {
    return 'SessionRefreshed';
  }
}

/**
 * Session Entity
 * Represents an authentication session
 */
export class Session extends Entity<AuthSessionId> {
  private constructor(private props: SessionProps) {
    super(props.sessionId);
  }

  // Getters
  get userId(): UniqueId {
    return this.props.userId;
  }

  get sessionId(): AuthSessionId {
    return this.props.sessionId;
  }

  get accessToken(): Token {
    return this.props.accessToken;
  }

  get refreshToken(): Token | undefined {
    return this.props.refreshToken;
  }

  get type(): SessionType {
    return this.props.type;
  }

  get status(): SessionStatus {
    return this.props.status;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get lastActivityAt(): Date {
    return this.props.lastActivityAt;
  }

  // Business Methods

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.props.status === SessionStatus.ACTIVE && !this.isExpired();
  }

  /**
   * Check if session is from a specific IP address
   */
  isFromIpAddress(ipAddress: string): boolean {
    return this.props.ipAddress === ipAddress;
  }

  /**
   * Check if session is from a specific user agent
   */
  isFromUserAgent(userAgent: string): boolean {
    return this.props.userAgent === userAgent;
  }

  /**
   * Refresh session tokens
   */
  refreshTokens(newAccessToken: Token, newRefreshToken?: Token): void {
    this.props.accessToken = newAccessToken;
    if (newRefreshToken) {
      this.props.refreshToken = newRefreshToken;
    }
    this.props.lastActivityAt = new Date();
    this.addDomainEvent(new SessionRefreshedEvent(
      this.props.sessionId.toString(),
      this.props.userId.value
    ));
  }

  /**
   * Revoke session
   */
  revoke(reason?: string): void {
    if (this.props.status === SessionStatus.REVOKED) {
      return; // Already revoked
    }

    const previousStatus = this.props.status;
    this.props.status = SessionStatus.REVOKED;
    this.addDomainEvent(new SessionRevokedEvent(
      this.props.sessionId.toString(),
      this.props.userId.value,
      reason
    ));
  }

  /**
   * Mark session as expired
   */
  markAsExpired(): void {
    if (this.props.status === SessionStatus.EXPIRED) {
      return; // Already expired
    }

    const previousStatus = this.props.status;
    this.props.status = SessionStatus.EXPIRED;
    this.addDomainEvent(new SessionExpiredEvent(
      this.props.sessionId.toString(),
      this.props.userId.value
    ));
  }

  /**
   * Update last activity time
   */
  updateActivity(): void {
    this.props.lastActivityAt = new Date();
  }

  /**
   * Create a new Session (factory method)
   */
  static create(props: SessionProps): Session {
    const session = new Session(props);
    session.addDomainEvent(new SessionCreatedEvent(
      props.sessionId.toString(),
      props.userId.value,
      props.type
    ));
    return session;
  }

  /**
   * Reconstitute Session from persistence (factory method)
   */
  static reconstitute(props: SessionProps): Session {
    return new Session(props);
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      sessionId: this.props.sessionId.toString(),
      userId: this.props.userId.value,
      accessToken: this.props.accessToken.toString(),
      refreshToken: this.props.refreshToken?.toString(),
      type: this.props.type,
      status: this.props.status,
      ipAddress: this.props.ipAddress,
      userAgent: this.props.userAgent,
      expiresAt: this.props.expiresAt,
      lastActivityAt: this.props.lastActivityAt,
    };
  }
}
