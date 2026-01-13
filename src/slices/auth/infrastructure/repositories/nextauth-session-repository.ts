import { injectable } from 'inversify';
import { ISessionRepository } from '../../domain/repositories/session-repository';
import { Session, SessionStatus, SessionType } from '../../domain/entities/session';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { AuthSessionId } from '../../domain/value-objects/auth-session-id';
import { Token } from '../../domain/value-objects/token';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';

/**
 * NextAuth Session Repository Adapter
 * 
 * This repository adapts NextAuth's JWT-based session management to the
 * Clean Architecture SessionRepository interface.
 * 
 * Note: NextAuth uses JWT tokens for sessions, which are stored client-side
 * and verified server-side. This repository provides a bridge between NextAuth's
 * session management and our Clean Architecture domain.
 * 
 * @see https://next-auth.js.org/getting-started/rest-api
 */
@injectable()
export class NextAuthSessionRepository implements ISessionRepository {
  /**
   * Find session by ID
   * 
   * Note: NextAuth doesn't provide direct session lookup by ID since sessions
   * are JWT tokens. This method will return null for most cases.
   */
  async findById(id: AuthSessionId): Promise<Session> {
    // NextAuth doesn't store sessions in database
    // Sessions are JWT tokens that are verified on each request
    throw new NotFoundError('Session', id.value);
  }

  /**
   * Find session by session ID (JWT token)
   */
  async findBySessionId(sessionId: string): Promise<Session> {
    // This would require JWT verification
    // For now, throw error as this is handled by NextAuth middleware
    throw new NotFoundError('Session', sessionId);
  }

  /**
   * Find sessions by user ID
   * 
   * Note: NextAuth doesn't track multiple sessions per user since sessions
   * are stateless JWT tokens. This method returns an empty array.
   */
  async findByUserId(userId: UniqueId): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Find active sessions for user
   */
  async findActiveByUserId(userId: UniqueId): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Find sessions by type
   */
  async findByType(type: SessionType, limit?: number, offset?: number): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Find sessions by status
   */
  async findByStatus(status: SessionStatus, limit?: number, offset?: number): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Find session by access token
   */
  async findByAccessToken(accessToken: Token): Promise<Session> {
    // NextAuth verifies JWT tokens on each request
    // This would require JWT verification
    throw new NotFoundError('Session', accessToken.value);
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(refreshToken: Token): Promise<Session> {
    // NextAuth doesn't use refresh tokens by default
    // This would need to be implemented if using refresh tokens
    throw new NotFoundError('Session', refreshToken.value);
  }

  /**
   * Save new session
   * 
   * Note: NextAuth creates sessions automatically during authentication flow.
   * This method is provided for completeness but won't be used in practice.
   */
  async save(session: Session): Promise<Session> {
    // NextAuth creates sessions automatically
    // This method is a no-op for NextAuth
    return session;
  }

  /**
   * Update existing session
   */
  async update(session: Session): Promise<Session> {
    // NextAuth doesn't update sessions in database
    // Sessions are immutable JWT tokens
    return session;
  }

  /**
   * Delete session
   * 
   * Note: To delete a NextAuth session, you need to sign out the user.
   * This is handled by NextAuth's signOut() function.
   */
  async delete(id: AuthSessionId): Promise<void> {
    // NextAuth doesn't store sessions in database
    // Use NextAuth's signOut() function instead
  }

  /**
   * Delete all sessions for a user
   * 
   * Note: This requires revoking all JWT tokens, which isn't directly
   * supported by NextAuth. You would need to implement token blacklisting
   * or use short-lived tokens with refresh tokens.
   */
  async deleteByUserId(userId: UniqueId): Promise<void> {
    // NextAuth doesn't store sessions in database
    // Consider implementing token blacklisting for this functionality
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllForUser(userId: UniqueId): Promise<number> {
    // NextAuth doesn't track sessions in database
    return 0;
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllForUser(userId: UniqueId): Promise<number> {
    // NextAuth doesn't track sessions in database
    return 0;
  }

  /**
   * Count sessions by user
   */
  async countByUserId(userId: UniqueId): Promise<number> {
    // NextAuth doesn't track sessions in database
    return 0;
  }

  /**
   * Count active sessions for user
   */
  async countActiveByUserId(userId: UniqueId): Promise<number> {
    // NextAuth doesn't track sessions in database
    return 0;
  }

  /**
   * Get total session count
   */
  async count(): Promise<number> {
    // NextAuth doesn't track sessions in database
    return 0;
  }

  /**
   * Find all sessions with pagination
   */
  async findAll(limit?: number, offset?: number): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Find expired sessions
   */
  async findExpired(limit?: number, offset?: number): Promise<Session[]> {
    // NextAuth doesn't track sessions in database
    return [];
  }

  /**
   * Delete expired sessions
   */
  async deleteExpired(): Promise<number> {
    // NextAuth doesn't track sessions in database
    // JWT tokens expire automatically based on their expiration time
    return 0;
  }

  /**
   * Get current session
   * 
   * This method uses NextAuth's getServerSession() to get the current session.
   */
  async getCurrentSession(): Promise<Session> {
    try {
      const { getServerSession } = await import('next-auth/next');
      const { authOptions } = await import('@/lib/auth-nextauth');
      
      const nextAuthSession = await getServerSession(authOptions);
      
      if (!nextAuthSession?.user || !('id' in nextAuthSession.user)) {
        throw new NotFoundError('Session', 'current');
      }

      // Create a Session entity from NextAuth session
      return Session.reconstitute({
        userId: UniqueId.create(nextAuthSession.user.id as string),
        sessionId: AuthSessionId.fromString('nextauth-session'),
        accessToken: new Token('nextauth-jwt-token'),
        refreshToken: undefined,
        type: SessionType.WEB,
        status: SessionStatus.ACTIVE,
        ipAddress: undefined,
        userAgent: undefined,
        expiresAt: typeof nextAuthSession.expires === 'string'
          ? new Date(nextAuthSession.expires)
          : nextAuthSession.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        lastActivityAt: new Date(),
      });
    } catch (error) {
      throw new NotFoundError('Session', 'current');
    }
  }
}
