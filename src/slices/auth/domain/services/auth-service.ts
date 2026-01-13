import { User, UserRole } from '../entities/user';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';
import { BusinessRuleViolationError } from '../../../../shared/domain/exceptions/business-rule-violation-error';

/**
 * Auth Service Interface
 * Contract for authentication operations
 */
export interface IAuthService {
  /**
   * Register a new user
   */
  register(
    email: Email,
    password: string,
    name?: string,
    username?: string
  ): Promise<User>;

  /**
   * Login with email and password
   */
  login(
    email: Email,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }>;

  /**
   * Login with Clerk (external auth provider)
   */
  loginWithClerk(
    clerkId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User>;

  /**
   * Logout user
   */
  logout(userId: string, sessionId: string): Promise<void>;

  /**
   * Verify user email
   */
  verifyEmail(userId: string, token: string): Promise<User>;

  /**
   * Change user password
   */
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void>;

  /**
   * Request password reset
   */
  requestPasswordReset(email: Email): Promise<void>;

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Promise<void>;

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, permission: string): Promise<boolean>;

  /**
   * Check if user has role
   */
  hasRole(userId: string, role: UserRole): Promise<boolean>;

  /**
   * Activate user account
   */
  activateUser(userId: string): Promise<User>;

  /**
   * Deactivate user account
   */
  deactivateUser(userId: string): Promise<User>;

  /**
   * Suspend user account
   */
  suspendUser(userId: string, reason?: string): Promise<User>;

  /**
   * Get user profile
   */
  getProfile(userId: string): Promise<User>;

  /**
   * Update user profile
   */
  updateProfile(
    userId: string,
    updates: {
      name?: string;
      username?: string;
      imageUrl?: string;
      bio?: string;
      location?: string;
      website?: string;
    }
  ): Promise<User>;
}
