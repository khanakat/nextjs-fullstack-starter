import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { User, UserRole, UserStatus } from '../entities/user';
import { Email } from '../value-objects/email';

/**
 * User Repository Interface
 * Contract for user data access
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: UniqueId): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Find user by Clerk ID
   */
  findByClerkId(clerkId: string): Promise<User | null>;

  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Check if email exists
   */
  emailExists(email: Email): Promise<boolean>;

  /**
   * Check if username exists
   */
  usernameExists(username: string): Promise<boolean>;

  /**
   * Save new user
   */
  save(user: User): Promise<User>;

  /**
   * Update existing user
   */
  update(user: User): Promise<User>;

  /**
   * Delete user
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Find users by role
   */
  findByRole(role: UserRole, limit?: number, offset?: number): Promise<User[]>;

  /**
   * Find users by status
   */
  findByStatus(status: UserStatus, limit?: number, offset?: number): Promise<User[]>;

  /**
   * Count users by role
   */
  countByRole(role: UserRole): Promise<number>;

  /**
   * Count users by status
   */
  countByStatus(status: UserStatus): Promise<number>;

  /**
   * Get total user count
   */
  count(): Promise<number>;

  /**
   * Find all users with pagination
   */
  findAll(limit?: number, offset?: number): Promise<User[]>;

  /**
   * Search users by name or email
   */
  search(query: string, limit?: number, offset?: number): Promise<User[]>;
}
