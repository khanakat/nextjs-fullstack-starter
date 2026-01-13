import { User } from '../entities/user';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { Email } from '@/shared/domain/value-objects/email';

/**
 * User Repository Interface
 * Defines the contract for user data persistence
 */
export interface IUserRepository {
  findById(id: UniqueId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByClerkId(clerkId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UniqueId): Promise<void>;
  exists(id: UniqueId): Promise<boolean>;
  existsByEmail(email: Email): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  findMany(params: {
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
  }>;
}