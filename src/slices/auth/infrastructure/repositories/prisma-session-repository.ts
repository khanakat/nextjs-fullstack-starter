import { injectable } from 'inversify';
import { ISessionRepository } from '../../domain/repositories/session-repository';
import { Session, SessionType, SessionStatus } from '../../domain/entities/session';
import { AuthSessionId } from '../../domain/value-objects/auth-session-id';
import { Token } from '../../domain/value-objects/token';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { prisma } from '@/lib/prisma';

/**
 * Helper function to convert Prisma string types to domain types
 * Handles null/undefined values and optional string fields
 */
function toDomainType(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return value;
}

/**
 * Prisma Session Repository
 * Prisma implementation of ISessionRepository
 */
@injectable()
export class PrismaSessionRepository implements ISessionRepository {
  /**
   * Find session by ID
   */
  async findById(id: AuthSessionId): Promise<Session> {
    const session = await prisma.session.findUnique({
      where: { id: id.value },
    });

    if (!session) {
      throw new NotFoundError('Session', id.value);
    }

    return Session.reconstitute({
      userId: UniqueId.create(session.userId),
      sessionId: AuthSessionId.fromString(session.sessionId),
      accessToken: new Token(session.accessToken),
      refreshToken: session.refreshToken ? new Token(session.refreshToken) : undefined,
      type: session.type as SessionType,
      status: session.status as SessionStatus,
      ipAddress: toDomainType(session.ipAddress),
      userAgent: toDomainType(session.userAgent),
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    });
  }

  /**
   * Find session by session ID string
   */
  async findBySessionId(sessionId: string): Promise<Session> {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    return Session.reconstitute({
      userId: UniqueId.create(session.userId),
      sessionId: AuthSessionId.fromString(session.sessionId),
      accessToken: new Token(session.accessToken),
      refreshToken: session.refreshToken ? new Token(session.refreshToken) : undefined,
      type: session.type as SessionType,
      status: session.status as SessionStatus,
      ipAddress: toDomainType(session.ipAddress),
      userAgent: toDomainType(session.userAgent),
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    });
  }

  /**
   * Find all active sessions for a user
   */
  async findActiveByUserId(userId: UniqueId): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId: userId.value,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    return sessions.map(session => Session.reconstitute({
      userId: UniqueId.create(session.userId),
      sessionId: AuthSessionId.fromString(session.sessionId),
      accessToken: new Token(session.accessToken),
      refreshToken: session.refreshToken ? new Token(session.refreshToken) : undefined,
      type: session.type as SessionType,
      status: session.status as SessionStatus,
      ipAddress: toDomainType(session.ipAddress),
      userAgent: toDomainType(session.userAgent),
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    }));
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: UniqueId): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      where: { userId: userId.value },
      orderBy: { lastActivityAt: 'desc' },
    });

    return sessions.map(session => Session.reconstitute({
      userId: UniqueId.create(session.userId),
      sessionId: AuthSessionId.fromString(session.sessionId),
      accessToken: new Token(session.accessToken),
      refreshToken: session.refreshToken ? new Token(session.refreshToken) : undefined,
      type: session.type as SessionType,
      status: session.status as SessionStatus,
      ipAddress: toDomainType(session.ipAddress),
      userAgent: toDomainType(session.userAgent),
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    }));
  }

  /**
   * Find sessions by type
   */
  async findByType(type: SessionType, limit?: number, offset?: number): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      where: { type },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => Session.reconstitute({
      userId: UniqueId.create(session.userId),
      sessionId: AuthSessionId.fromString(session.sessionId),
      accessToken: new Token(session.accessToken),
      refreshToken: session.refreshToken ? new Token(session.refreshToken) : undefined,
      type: session.type as SessionType,
      status: session.status as SessionStatus,
      ipAddress: toDomainType(session.ipAddress),
      userAgent: toDomainType(session.userAgent),
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    }));
  }

  /**
   * Find sessions by status
   */
  async findByStatus(status: SessionStatus, limit?: number, offset?: number): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      where: { status },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => Session.reconstitute({
      userId: UniqueId.create(session.userId),
      sessionId: AuthSessionId.fromString(session.sessionId),
      accessToken: new Token(session.accessToken),
      refreshToken: session.refreshToken ? new Token(session.refreshToken) : undefined,
      type: session.type as SessionType,
      status: session.status as SessionStatus,
      ipAddress: toDomainType(session.ipAddress),
      userAgent: toDomainType(session.userAgent),
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    }));
  }

  /**
   * Save new session
   */
  async save(session: Session): Promise<Session> {
    const data = session.toPersistence();

    const created = await prisma.session.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        type: data.type,
        status: data.status,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
        lastActivityAt: data.lastActivityAt,
      },
    });

    return Session.reconstitute({
      userId: UniqueId.create(created.userId),
      sessionId: AuthSessionId.fromString(created.sessionId),
      accessToken: new Token(created.accessToken),
      refreshToken: created.refreshToken ? new Token(created.refreshToken) : undefined,
      type: created.type as SessionType,
      status: created.status as SessionStatus,
      ipAddress: toDomainType(created.ipAddress),
      userAgent: toDomainType(created.userAgent),
      expiresAt: created.expiresAt,
      lastActivityAt: created.lastActivityAt,
    });
  }

  /**
   * Update existing session
   */
  async update(session: Session): Promise<Session> {
    const data = session.toPersistence();

    const updated = await prisma.session.update({
      where: { id: session.id.value },
      data: {
        lastActivityAt: new Date(),
        userId: data.userId,
        sessionId: data.sessionId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        type: data.type,
        status: data.status,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });

    return Session.reconstitute({
      userId: UniqueId.create(updated.userId),
      sessionId: AuthSessionId.fromString(updated.sessionId),
      accessToken: new Token(updated.accessToken),
      refreshToken: updated.refreshToken ? new Token(updated.refreshToken) : undefined,
      type: updated.type as SessionType,
      status: updated.status as SessionStatus,
      ipAddress: toDomainType(updated.ipAddress),
      userAgent: toDomainType(updated.userAgent),
      expiresAt: updated.expiresAt,
      lastActivityAt: updated.lastActivityAt,
    });
  }

  /**
   * Delete session
   */
  async delete(id: AuthSessionId): Promise<void> {
    await prisma.session.delete({
      where: { id: id.value },
    });
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: UniqueId): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId: userId.value },
    });
  }

  /**
   * Delete all expired sessions
   */
  async deleteExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  /**
   * Count sessions by user
   */
  async countByUserId(userId: UniqueId): Promise<number> {
    return await prisma.session.count({
      where: { userId: userId.value },
    });
  }

  /**
   * Count active sessions by user
   */
  async countActiveByUserId(userId: UniqueId): Promise<number> {
    return await prisma.session.count({
      where: {
        userId: userId.value,
        status: SessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Get total session count
   */
  async count(): Promise<number> {
    return await prisma.session.count();
  }

  /**
   * Find all sessions with pagination
   */
  async findAll(limit?: number, offset?: number): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => Session.reconstitute({
      userId: UniqueId.create(session.userId),
      sessionId: AuthSessionId.fromString(session.sessionId),
      accessToken: new Token(session.accessToken),
      refreshToken: session.refreshToken ? new Token(session.refreshToken) : undefined,
      type: session.type as SessionType,
      status: session.status as SessionStatus,
      ipAddress: toDomainType(session.ipAddress),
      userAgent: toDomainType(session.userAgent),
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
    }));
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllForUser(userId: UniqueId): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId: userId.value },
      data: { status: SessionStatus.REVOKED },
    });

    return result.count;
  }
}
