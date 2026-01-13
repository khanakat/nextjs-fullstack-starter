import { injectable, inject } from 'inversify';
import { ISessionService } from '../../domain/services/session-service';
import type { ISessionRepository } from '../../domain/repositories/session-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { Session, SessionType, SessionStatus } from '../../domain/entities/session';
import { Token } from '../../domain/value-objects/token';
import { AuthSessionId } from '../../domain/value-objects/auth-session-id';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * NextAuth Session Service
 * 
 * Implementation of ISessionService using NextAuth's JWT-based session management.
 * Since NextAuth uses stateless JWT tokens, this service provides
 * limited functionality compared to a traditional database-backed session service.
 * 
 * @see https://next-auth.js.org/getting-started/rest-api
 */
@injectable()
export class NextAuthSessionService implements ISessionService {
  private readonly DEFAULT_SESSION_EXPIRY_DAYS = 30;
  private readonly DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS = 90;

  constructor(
    @inject(TYPES.SessionRepository) private readonly sessionRepository: ISessionRepository
  ) {}

  /**
   * Create a new session
   * 
   * Note: NextAuth creates sessions automatically during authentication flow.
   * This method is provided for completeness but won't be used in practice.
   */
  async createSession(
    userId: UniqueId,
    accessToken: Token,
    type: SessionType,
    refreshToken?: Token,
    ipAddress?: string,
    userAgent?: string,
    expiresAt?: Date
  ): Promise<Session> {
    const expiryDate = expiresAt || new Date(
      Date.now() + this.DEFAULT_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const session = Session.create({
      userId,
      sessionId: AuthSessionId.generate(),
      accessToken,
      refreshToken,
      type,
      status: SessionStatus.ACTIVE,
      ipAddress,
      userAgent,
      expiresAt: expiryDate,
      lastActivityAt: new Date(),
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Validate session
   * 
   * Note: NextAuth validates JWT tokens on each request automatically.
   * This method is a placeholder for the interface.
   */
  async validateSession(sessionId: string, accessToken: Token): Promise<boolean> {
    // NextAuth validates JWT tokens automatically
    // This is handled by NextAuth middleware
    return true;
  }

  /**
   * Refresh session tokens
   * 
   * Note: NextAuth doesn't use refresh tokens by default.
   * This method is a placeholder for the interface.
   */
  async refreshSession(sessionId: string, refreshToken: Token): Promise<{
    accessToken: Token;
    refreshToken: Token;
  }> {
    // NextAuth doesn't use refresh tokens by default
    // This would need to be implemented if using refresh tokens
    throw new Error('Token refresh is not supported by NextAuth');
  }

  /**
   * Revoke session
   * 
   * Note: To revoke a NextAuth session, you need to sign out the user.
   * This is handled by NextAuth's signOut() function.
   */
  async revokeSession(sessionId: string, userId: UniqueId, reason?: string): Promise<void> {
    // NextAuth doesn't store sessions in database
    // Use NextAuth's signOut() function instead
  }

  /**
   * Revoke all sessions for user
   * 
   * Note: This requires revoking all JWT tokens, which isn't directly
   * supported by NextAuth. You would need to implement token blacklisting
   * or use short-lived tokens with refresh tokens.
   */
  async revokeAllSessions(userId: UniqueId): Promise<number> {
    // NextAuth doesn't track sessions in database
    // Consider implementing token blacklisting for this functionality
    return 0;
  }

  /**
   * Get session
   * 
   * Note: NextAuth doesn't provide direct session lookup by ID.
   * This method will return null for most cases.
   */
  async getSession(sessionId: string): Promise<Session | null> {
    // NextAuth doesn't store sessions in database
    return null;
  }

  /**
   * Get all active sessions for user
   * 
   * Note: NextAuth doesn't track sessions in database.
   */
  async getActiveSessions(userId: UniqueId): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Get all sessions for user
   * 
   * Note: NextAuth doesn't track sessions in database.
   */
  async getAllSessions(userId: UniqueId): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Clean up expired sessions
   * 
   * Note: NextAuth doesn't track sessions in database.
   * JWT tokens expire automatically based on their expiration time.
   */
  async cleanupExpiredSessions(): Promise<number> {
    // NextAuth doesn't track sessions in database
    return 0;
  }

  /**
   * Update session activity
   * 
   * Note: NextAuth doesn't track session activity in database.
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    // NextAuth doesn't track sessions in database
  }

  /**
   * Get current session
   *
   * Uses NextAuth's getServerSession() to get the current session.
   */
  async getCurrentSession(): Promise<Session | null> {
    // NextAuth session retrieval is handled by the repository
    const { NextAuthSessionRepository } = await import(
      '../../infrastructure/repositories/nextauth-session-repository'
    );
    const repo = new NextAuthSessionRepository();
    return await repo.getCurrentSession();
  }
}
