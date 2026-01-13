import { injectable, inject } from 'inversify';
import { IAuthService } from '../../domain/services/auth-service';
import type { IUserRepository } from '../../domain/repositories/user-repository';
import type { ISessionRepository } from '../../domain/repositories/session-repository';
import type { IPasswordService } from '../../domain/services/password-service';
import type { IMfaService } from '../../domain/services/mfa-service';
import type { ISessionService } from '../../domain/services/session-service';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { User, UserRole, UserStatus } from '../../domain/entities/user';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { SessionType, SessionStatus } from '../../domain/entities/session';
import { Token } from '../../domain/value-objects/token';
import { TYPES } from '@/shared/infrastructure/di/types';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { BusinessRuleViolationError } from '../../../../shared/domain/exceptions/business-rule-violation-error';

/**
 * Auth Service Implementation
 * 
 * Main authentication service that orchestrates user registration,
 * login, logout, and other auth-related operations.
 * 
 * This service integrates with NextAuth/Clerk for session management
 * while maintaining Clean Architecture principles.
 */
@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository,
    @inject(TYPES.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(TYPES.PasswordService) private readonly passwordService: IPasswordService,
    @inject(TYPES.MfaService) private readonly mfaService: IMfaService,
    @inject(TYPES.SessionService) private readonly sessionService: ISessionService
  ) {}

  /**
   * Register a new user
   * 
   * Creates a new user account with email and password.
   * Password is hashed before storage.
   */
  async register(
    email: Email,
    password: string,
    name?: string,
    username?: string
  ): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.userRepository.emailExists(email);
    if (existingEmail) {
      throw new BusinessRuleViolationError('email', 'Email already registered');
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await this.userRepository.usernameExists(username);
      if (existingUsername) {
        throw new BusinessRuleViolationError('username', 'Username already taken');
      }
    }

    // Validate password strength
    const passwordStrength = this.passwordService.validateStrength(password);
    if (!passwordStrength.isValid) {
      throw new BusinessRuleViolationError('password', passwordStrength.errors.join(', '));
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(password);

    // Create user
    const user = User.create({
      email,
      passwordHash,
      name,
      username,
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Login with email and password
   * 
   * Authenticates user with email and password.
   * Returns user and tokens on successful authentication.
   */
  async login(
    email: Email,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User', 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new BusinessRuleViolationError('status', 'User account is not active');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new BusinessRuleViolationError('auth', 'User does not have a password set');
    }

    const isPasswordValid = await this.passwordService.verify(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BusinessRuleViolationError('password', 'Invalid email or password');
    }

    // Check if MFA is enabled
    const mfaDevices = await this.mfaService.getMfaDevices(user.id);
    if (mfaDevices.length > 0) {
      // MFA is enabled, return user without tokens
      // Caller should verify MFA code before getting tokens
      return {
        user,
        accessToken: '',
        refreshToken: '',
      };
    }

    // Create session
    const accessToken = new Token(this.generateAccessToken(user.id.value));
    const refreshToken = new Token(this.generateRefreshToken(user.id.value));

    const session = await this.sessionService.createSession(
      user.id,
      accessToken,
      SessionType.WEB,
      refreshToken,
      ipAddress,
      userAgent
    );

    return {
      user,
      accessToken: accessToken.toString(),
      refreshToken: refreshToken.toString(),
    };
  }

  /**
   * Login with Clerk (external auth provider)
   * 
   * Authenticates user using Clerk ID.
   * This is used when user signs in via Clerk.
   */
  async loginWithClerk(
    clerkId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    // Find user by Clerk ID
    const user = await this.userRepository.findByClerkId(clerkId);
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new BusinessRuleViolationError('status', 'User account is not active');
    }

    return user;
  }

  /**
   * Logout user
   * 
   * Revokes the user's session.
   * For NextAuth, this is handled by the signOut() function.
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    // NextAuth handles logout via signOut() function
    // This method is a placeholder for the interface
  }

  /**
   * Verify user email
   * 
   * Marks user's email as verified.
   * This is typically called after user clicks verification link.
   */
  async verifyEmail(userId: string, token: string): Promise<User> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    // Verify email token (simplified - should use proper token verification)
    // TODO: Implement proper email verification token logic

    user.verifyEmail();
    return await this.userRepository.update(user);
  }

  /**
   * Change user password
   * 
   * Changes user's password after verifying current password.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    if (!user.passwordHash) {
      throw new BusinessRuleViolationError('auth', 'User does not have a password set');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.verify(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new BusinessRuleViolationError('password', 'Current password is incorrect');
    }

    // Validate new password strength
    const passwordStrength = this.passwordService.validateStrength(newPassword);
    if (!passwordStrength.isValid) {
      throw new BusinessRuleViolationError('password', passwordStrength.errors.join(', '));
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hash(newPassword);

    // Update user password
    user.changePassword(newPasswordHash);
    await this.userRepository.update(user);
  }

  /**
   * Request password reset
   * 
   * Initiates password reset flow for user.
   * Sends a reset token to user's email.
   */
  async requestPasswordReset(email: Email): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    // Generate reset token
    const resetToken = this.generateResetToken(user.id.value);

    // TODO: Send password reset email with token
    console.log(`[Auth] Password reset token for ${email.toString()}: ${resetToken}`);
  }

  /**
   * Reset password with token
   * 
   * Resets user's password using a reset token.
   * Token should be validated before allowing password reset.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // TODO: Implement proper token validation and user lookup
    throw new BusinessRuleViolationError('token', 'Password reset token validation not implemented');
  }

  /**
   * Check if user has permission
   * 
   * Checks if user has a specific permission.
   * This is a simplified implementation that checks user role.
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      return false;
    }

    // Simplified permission check based on role
    // TODO: Implement proper RBAC system
    switch (permission) {
      case 'admin':
        return user.isAdmin();
      case 'create':
      case 'read':
        return user.isActive();
      case 'update':
      case 'delete':
        return user.canPerformAdminActions();
      default:
        return false;
    }
  }

  /**
   * Check if user has role
   * 
   * Checks if user has a specific role.
   */
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      return false;
    }

    return user.hasRole(role);
  }

  /**
   * Activate user account
   * 
   * Activates a user account.
   */
  async activateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    user.activate();
    return await this.userRepository.update(user);
  }

  /**
   * Deactivate user account
   * 
   * Deactivates a user account.
   */
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    user.deactivate();
    return await this.userRepository.update(user);
  }

  /**
   * Suspend user account
   * 
   * Suspends a user account for security or policy reasons.
   */
  async suspendUser(userId: string, reason?: string): Promise<User> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    user.suspend();
    // Note: reason is logged but not stored in User entity
    return await this.userRepository.update(user);
  }

  /**
   * Get user profile
   * 
   * Retrieves user's profile information.
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * 
   * Updates user's profile information.
   */
  async updateProfile(
    userId: string,
    updates: {
      name?: string;
      username?: string;
      imageUrl?: string;
      bio?: string;
      location?: string;
      website?: string;
    }
  ): Promise<User> {
    const user = await this.userRepository.findById(UniqueId.create(userId));
    if (!user) {
      throw new NotFoundError('User', 'User not found');
    }

    // Check if username is already taken (if updating username)
    if (updates.username) {
      const existingUsername = await this.userRepository.usernameExists(updates.username);
      if (existingUsername && user.username !== updates.username) {
        throw new BusinessRuleViolationError('username', 'Username already taken');
      }
    }

    user.updateProfile(updates);
    return await this.userRepository.update(user);
  }

  /**
   * Generate access token
   * 
   * Generates a JWT access token for the user.
   * This is a simplified implementation.
   * TODO: Integrate with proper JWT library (jsonwebtoken, etc.)
   */
  private generateAccessToken(userId: string): string {
    // Simplified token generation
    // TODO: Use proper JWT library with signing
    const payload = { userId, type: 'access' };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Generate refresh token
   * 
   * Generates a JWT refresh token for the user.
   * This is a simplified implementation.
   * TODO: Integrate with proper JWT library (jsonwebtoken, etc.)
   */
  private generateRefreshToken(userId: string): string {
    // Simplified token generation
    // TODO: Use proper JWT library with signing
    const payload = { userId, type: 'refresh' };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Generate reset token
   * 
   * Generates a password reset token for the user.
   * This is a simplified implementation.
   * TODO: Use proper token generation with expiration
   */
  private generateResetToken(userId: string): string {
    // Simplified token generation
    // TODO: Use proper token generation with expiration
    const payload = { userId, type: 'reset', timestamp: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}
