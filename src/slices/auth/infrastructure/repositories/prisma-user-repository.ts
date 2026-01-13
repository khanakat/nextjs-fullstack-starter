import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../domain/repositories/user-repository';
import { User, UserRole, UserStatus } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Prisma User Repository
 * Prisma implementation of IUserRepository
 */
@injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(@inject(TYPES.PrismaClient) private readonly prisma: PrismaClient) {}

  /**
   * Find user by ID
   */
  async findById(id: UniqueId): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: id.value },
    });

    if (!user) {
      return null;
    }

    return User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role as UserRole,
      status: UserStatus.ACTIVE, // Default since not in Prisma schema
      emailVerified: false, // Default since not in Prisma schema
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: Email): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toString() },
    });

    if (!user) {
      return null;
    }

    return User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role as UserRole,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });
  }

  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return null;
    }

    return User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role as UserRole,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: Email): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toString() },
    });

    return !!user;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    return User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role as UserRole,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return !!user;
  }

  /**
   * Save new user
   */
  async save(user: User): Promise<User> {
    const data = user.toPersistence();

    const created = await this.prisma.user.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        hashedPassword: data.passwordHash,
        name: data.name,
        username: data.username,
        imageUrl: data.imageUrl,
        bio: data.bio,
        location: data.location,
        website: data.website,
        role: data.role,
      },
    });

    return User.reconstitute(UniqueId.create(created.id), {
      clerkId: created.clerkId ?? undefined,
      email: new Email(created.email),
      passwordHash: created.hashedPassword ? new PasswordHash(created.hashedPassword) : undefined,
      name: created.name ?? undefined,
      username: created.username ?? undefined,
      imageUrl: created.imageUrl ?? undefined,
      bio: created.bio ?? undefined,
      location: created.location ?? undefined,
      website: created.website ?? undefined,
      role: created.role as UserRole,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });
  }

  /**
   * Update existing user
   */
  async update(user: User): Promise<User> {
    const data = user.toPersistence();

    const updated = await this.prisma.user.update({
      where: { id: user.id.value },
      data: {
        clerkId: data.clerkId,
        email: data.email,
        hashedPassword: data.passwordHash,
        name: data.name,
        username: data.username,
        imageUrl: data.imageUrl,
        bio: data.bio,
        location: data.location,
        website: data.website,
        role: data.role,
      },
    });

    return User.reconstitute(user.id, {
      clerkId: updated.clerkId ?? undefined,
      email: new Email(updated.email),
      passwordHash: updated.hashedPassword ? new PasswordHash(updated.hashedPassword) : undefined,
      name: updated.name ?? undefined,
      username: updated.username ?? undefined,
      imageUrl: updated.imageUrl ?? undefined,
      bio: updated.bio ?? undefined,
      location: updated.location ?? undefined,
      website: updated.website ?? undefined,
      role: updated.role as UserRole,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });
  }

  /**
   * Delete user
   */
  async delete(id: UniqueId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.value },
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole, limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { role },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user: any) => User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    }));
  }

  /**
   * Find users by status
   */
  async findByStatus(status: string, limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { role: status }, // Map status to role since status field doesn't exist
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user: any) => User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    }));
  }

  /**
   * Count users by role
   */
  async countByRole(role: UserRole): Promise<number> {
    return await this.prisma.user.count({
      where: { role },
    });
  }

  /**
   * Count users by status
   */
  async countByStatus(status: string): Promise<number> {
    return await this.prisma.user.count({
      where: { role: status }, // Map status to role since status field doesn't exist
    });
  }

  /**
   * Get total user count
   */
  async count(): Promise<number> {
    return await this.prisma.user.count();
  }

  /**
   * Find all users with pagination
   */
  async findAll(limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user: any) => User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    }));
  }

  /**
   * Search users by name or email
   */
  async search(query: string, limit?: number, offset?: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user: any) => User.reconstitute(UniqueId.create(user.id), {
      clerkId: user.clerkId ?? undefined,
      email: new Email(user.email),
      passwordHash: user.hashedPassword ? new PasswordHash(user.hashedPassword) : undefined,
      name: user.name ?? undefined,
      username: user.username ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
      bio: user.bio ?? undefined,
      location: user.location ?? undefined,
      website: user.website ?? undefined,
      role: user.role,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    }));
  }
}
