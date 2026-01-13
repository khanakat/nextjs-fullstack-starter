import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '@/shared/infrastructure/database/base-repository';
import { IUserRepository } from '../../domain/repositories/user-repository';
import { User, UserRole } from '../../domain/entities/user';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { Email } from '@/shared/domain/value-objects/email';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Prisma User Repository Implementation
 * Handles user data persistence using Prisma ORM
 */
@injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly db: PrismaClient
  ) {}

  async findById(id: UniqueId): Promise<User | null> {
    const userData = await this.db.user.findUnique({
      where: { id: id.id },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this.db.user.findUnique({
      where: { email: email.email },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    const userData = await this.db.user.findUnique({
      where: { clerkId },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userData = await this.db.user.findUnique({
      where: { username },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async save(user: User): Promise<void> {
    const persistenceData = this.toPersistence(user);

    await this.db.user.upsert({
      where: { id: user.id.id },
      create: persistenceData,
      update: {
        ...persistenceData,
        id: undefined, // Don't update ID
        createdAt: undefined, // Don't update creation date
      },
    });
  }

  async delete(id: UniqueId): Promise<void> {
    await this.db.user.delete({
      where: { id: id.id },
    });
  }

  async exists(id: UniqueId): Promise<boolean> {
    const count = await this.db.user.count({
      where: { id: id.id },
    });
    return count > 0;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.db.user.count({
      where: { email: email.email },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.db.user.count({
      where: { username },
    });
    return count > 0;
  }

  async findMany(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    // Get total count
    const total = await this.db.user.count({ where });

    // Get users
    const usersData = await this.db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const users = usersData.map((userData: any) => this.toDomain(userData));
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  private toDomain(raw: any): User {
    return User.fromPersistence(raw);
  }

  private toPersistence(user: User): any {
    return {
      id: user.id.id,
      clerkId: user.clerkId,
      email: user.email, // User.email getter returns string
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      bio: user.bio,
      location: user.location,
      website: user.website,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}