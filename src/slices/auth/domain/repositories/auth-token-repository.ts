import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { AuthToken, AuthTokenType } from '../entities/auth-token';

/**
 * Auth Token Repository Interface
 * Contract for auth token data access
 */
export interface IAuthTokenRepository {
  /**
   * Find token by ID
   */
  findById(id: UniqueId): Promise<AuthToken | null>;

  /**
   * Find token by token string
   */
  findByToken(token: string): Promise<AuthToken | null>;

  /**
   * Find all tokens for a user
   */
  findByUserId(userId: UniqueId): Promise<AuthToken[]>;

  /**
   * Find tokens by type
   */
  findByType(type: AuthTokenType, limit?: number, offset?: number): Promise<AuthToken[]>;

  /**
   * Find valid tokens for a user
   */
  findValidByUserId(userId: UniqueId): Promise<AuthToken[]>;

  /**
   * Find expired tokens
   */
  findExpired(limit?: number, offset?: number): Promise<AuthToken[]>;

  /**
   * Find unused tokens
   */
  findUnused(limit?: number, offset?: number): Promise<AuthToken[]>;

  /**
   * Save new token
   */
  save(token: AuthToken): Promise<AuthToken>;

  /**
   * Update existing token
   */
  update(token: AuthToken): Promise<AuthToken>;

  /**
   * Delete token
   */
  delete(id: UniqueId): Promise<void>;

  /**
   * Delete all tokens for a user
   */
  deleteByUserId(userId: UniqueId): Promise<void>;

  /**
   * Delete all expired tokens
   */
  deleteExpired(): Promise<number>;

  /**
   * Delete all tokens by type
   */
  deleteByType(type: AuthTokenType): Promise<number>;

  /**
   * Count tokens by user
   */
  countByUserId(userId: UniqueId): Promise<number>;

  /**
   * Count valid tokens by user
   */
  countValidByUserId(userId: UniqueId): Promise<number>;

  /**
   * Get total token count
   */
  count(): Promise<number>;

  /**
   * Find all tokens with pagination
   */
  findAll(limit?: number, offset?: number): Promise<AuthToken[]>;

  /**
   * Invalidate all tokens for a user
   */
  invalidateAllForUser(userId: UniqueId): Promise<number>;
}
