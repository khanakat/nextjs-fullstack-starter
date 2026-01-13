import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { AuthSessionId } from '../value-objects/auth-session-id';
import { Session, SessionType, SessionStatus } from '../entities/session';

/**
 * Session Repository Interface
 * Contract for session data access
 */
export interface ISessionRepository {
  /**
   * Find session by ID
   */
  findById(id: AuthSessionId): Promise<Session>;

  /**
   * Find session by session ID string
   */
  findBySessionId(sessionId: string): Promise<Session>;

  /**
   * Find all active sessions for a user
   */
  findActiveByUserId(userId: UniqueId): Promise<Session[]>;

  /**
   * Find all sessions for a user
   */
  findByUserId(userId: UniqueId): Promise<Session[]>;

  /**
   * Find sessions by type
   */
  findByType(type: SessionType, limit?: number, offset?: number): Promise<Session[]>;

  /**
   * Find sessions by status
   */
  findByStatus(status: SessionStatus, limit?: number, offset?: number): Promise<Session[]>;

  /**
   * Save new session
   */
  save(session: Session): Promise<Session>;

  /**
   * Update existing session
   */
  update(session: Session): Promise<Session>;

  /**
   * Delete session
   */
  delete(id: AuthSessionId): Promise<void>;

  /**
   * Delete all sessions for a user
   */
  deleteByUserId(userId: UniqueId): Promise<void>;

  /**
   * Delete all expired sessions
   */
  deleteExpired(): Promise<number>;

  /**
   * Count sessions by user
   */
  countByUserId(userId: UniqueId): Promise<number>;

  /**
   * Count active sessions by user
   */
  countActiveByUserId(userId: UniqueId): Promise<number>;

  /**
   * Get total session count
   */
  count(): Promise<number>;

  /**
   * Find all sessions with pagination
   */
  findAll(limit?: number, offset?: number): Promise<Session[]>;

  /**
   * Revoke all sessions for a user
   */
  revokeAllForUser(userId: UniqueId): Promise<number>;
}
