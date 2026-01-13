import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { Session, SessionType, SessionStatus } from '../entities/session';
import { Token } from '../value-objects/token';

/**
 * Session Service Interface
 * Contract for session management
 */
export interface ISessionService {
  /**
   * Create a new session
   */
  createSession(
    userId: UniqueId,
    accessToken: Token,
    type: SessionType,
    refreshToken?: Token,
    ipAddress?: string,
    userAgent?: string,
    expiresAt?: Date
  ): Promise<Session>;

  /**
   * Validate session
   */
  validateSession(sessionId: string, accessToken: Token): Promise<boolean>;

  /**
   * Refresh session tokens
   */
  refreshSession(sessionId: string, refreshToken: Token): Promise<{
    accessToken: Token;
    refreshToken: Token;
  }>;

  /**
   * Revoke session
   */
  revokeSession(sessionId: string, userId: UniqueId, reason?: string): Promise<void>;

  /**
   * Revoke all sessions for user
   */
  revokeAllSessions(userId: UniqueId): Promise<number>;

  /**
   * Get session
   */
  getSession(sessionId: string): Promise<Session | null>;

  /**
   * Get all active sessions for user
   */
  getActiveSessions(userId: UniqueId): Promise<Session[]>;

  /**
   * Get all sessions for user
   */
  getAllSessions(userId: UniqueId): Promise<Session[]>;

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): Promise<number>;

  /**
   * Update session activity
   */
  updateSessionActivity(sessionId: string): Promise<void>;
}
