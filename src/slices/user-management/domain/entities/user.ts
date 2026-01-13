import { AggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { Email } from '../../../../shared/domain/value-objects/email';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { UserCreatedEvent } from '../events/user-created-event';
import { UserUpdatedEvent } from '../events/user-updated-event';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';

// Additional domain events
class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly oldRole: UserRole,
    public readonly newRole: UserRole
  ) {
    super();
  }

  getEventName(): string {
    return 'UserRoleChanged';
  }
}

class UserDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly deactivatedAt: Date
  ) {
    super();
  }

  getEventName(): string {
    return 'UserDeactivated';
  }
}

class UserSuspendedEvent extends DomainEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly reason: string,
    public readonly suspendedUntil: Date
  ) {
    super();
  }

  getEventName(): string {
    return 'UserSuspended';
  }
}

class EmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly email: string,
    public readonly verifiedAt: Date
  ) {
    super();
  }

  getEventName(): string {
    return 'EmailVerified';
  }
}

export interface UserProps {
  clerkId?: string;
  email: Email;
  name?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  role: UserRole;
  preferences?: Record<string, any>;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  loginCount?: number;
  passwordChangeRequired?: boolean;
  passwordHash?: string;
  passwordUpdatedAt?: Date;
  suspendedAt?: Date;
  suspendedUntil?: Date;
  suspensionReason?: string;
  isActive?: boolean;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
  USER = 'USER',
  VIEWER = 'VIEWER',
  GUEST = 'GUEST'
}

/**
 * User Domain Entity
 * Represents a user in the system with business rules and invariants
 */
export class User extends AggregateRoot<UniqueId> {
  private constructor(private props: UserProps, id?: UniqueId) {
    super(id || UniqueId.generate());
  }

  static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'> | any, id?: UniqueId): User {
    // Validate required fields
    if (props.name !== undefined && props.name.trim() === '') {
      throw new ValidationError('name', 'Name cannot be empty');
    }

    // Convert string email to Email object if needed
    const email = typeof props.email === 'string' ? new Email(props.email) : props.email;

    const now = new Date();
    const userProps: UserProps = {
      ...props,
      email,
      role: props.role || UserRole.USER, // Default role
      isActive: props.isActive !== false, // Default to true unless explicitly set to false
      createdAt: now,
      updatedAt: now,
    };

    const user = new User(userProps, id);
    
    // Add domain event for new user creation
    user.addDomainEvent(new UserCreatedEvent(user.id, user.email, user.name));

    return user;
  }

  // Getters
  // Tests expect explicit getter methods like getId/getName/getEmail
  // Provide these in addition to property accessors for compatibility
  public getId(): UniqueId {
    return this.id;
  }

  public getName(): string | undefined {
    return this.props.name;
  }

  public getEmail(): Email {
    return this.props.email;
  }

  public getUsername(): string | undefined {
    return this.props.username;
  }

  get clerkId(): string | undefined {
    return this.props.clerkId;
  }

  get email(): string {
    return this.props.email.email;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get username(): string | undefined {
    return this.props.username;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get bio(): string | undefined {
    return this.props.bio;
  }

  get location(): string | undefined {
    return this.props.location;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get preferences(): Record<string, any> {
    return this.props.preferences || {};
  }

  get emailVerified(): boolean {
    return this.props.emailVerified || false;
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt || null;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get lastLoginIp(): string | undefined {
    return this.props.lastLoginIp;
  }

  get loginCount(): number {
    return this.props.loginCount || 0;
  }

  get lastLoginUserAgent(): string | undefined {
    return this.props.lastLoginUserAgent;
  }

  get passwordChangeRequired(): boolean {
    return this.props.passwordChangeRequired || false;
  }

  get passwordHash(): string | undefined {
    return this.props.passwordHash;
  }

  get passwordUpdatedAt(): Date | undefined {
    return this.props.passwordUpdatedAt;
  }

  get suspendedAt(): Date | null {
    return this.props.suspendedAt || null;
  }

  get suspendedUntil(): Date | null {
    return this.props.suspendedUntil || null;
  }

  get suspensionReason(): string | null {
    return this.props.suspensionReason || null;
  }

  get isActive(): boolean {
    return this.props.isActive !== false;
  }

  get deactivatedAt(): Date | null {
    return this.props.deactivatedAt || null;
  }

  get avatar(): string | null {
    return this.props.imageUrl || null;
  }

  // Business methods
  updateProfile(updates: {
    name?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
    imageUrl?: string;
  }): void {
    // Validate username uniqueness (this would be checked at repository level)
    if (updates.username && updates.username.length < 3) {
      throw new ValidationError('username', 'must be at least 3 characters long');
    }

    // Validate website URL format
    if (updates.website && !this.isValidUrl(updates.website)) {
      throw new ValidationError('website', 'invalid URL format');
    }

    const oldProps = { ...this.props };

    this.props = {
      ...this.props,
      ...updates,
      updatedAt: new Date(),
    };

    // Add domain event for profile update
    this.addDomainEvent(new UserUpdatedEvent(this.id, oldProps, this.props));
  }

  changeRole(newRole: UserRole): void {
    if (this.props.role === newRole) {
      return; // No change needed
    }

    const oldRole = this.props.role;
    this.props.role = newRole;
    this.props.updatedAt = new Date();

    // Add domain event for role change
    this.addDomainEvent(new UserRoleChangedEvent(this.id, oldRole, newRole));
  }

  updateEmail(newEmailValue: string): void {
    const newEmail = new Email(newEmailValue);
    if (this.props.email.equals(newEmail)) {
      return; // No change needed
    }

    const oldEmail = this.props.email;
    this.props.email = newEmail;
    // Reset email verification when email changes
    this.props.emailVerified = false;
    this.props.emailVerifiedAt = undefined;
    this.props.updatedAt = new Date();
    
    // Add domain event for email update
    this.addDomainEvent(new UserUpdatedEvent(this.id, { email: oldEmail.email }, { email: newEmail.email }));
  }

  // Business rules
  canManageUsers(): boolean {
    return this.props.role === UserRole.ADMIN || this.props.role === UserRole.OWNER;
  }

  canManageOrganization(): boolean {
    return this.props.role === UserRole.OWNER || this.props.role === UserRole.ADMIN;
  }

  hasPermission(permission: string): boolean {
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.OWNER]: ['*'],
      [UserRole.ADMIN]: [
        'admin',
        'manage_users',
        'manage_content',
        'view_analytics',
        'manage_settings'
      ],
      [UserRole.MANAGER]: ['manage_content', 'view_analytics'],
      [UserRole.MODERATOR]: ['manage_content', 'moderate_content'],
      [UserRole.MEMBER]: ['create_content', 'view_content'],
      [UserRole.USER]: ['create_content', 'view_content'],
      [UserRole.VIEWER]: ['view_content'],
      [UserRole.GUEST]: ['view_content'],
    };

    const permissions = rolePermissions[this.props.role] || [];
    const normalized =
      permission === 'read'
        ? 'view_content'
        : permission === 'write'
        ? 'create_content'
        : permission;

    return permissions.includes('*') || permissions.includes(normalized);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }





  verifyEmail(): void {
    const now = new Date();
    this.props.emailVerified = true;
    this.props.emailVerifiedAt = now;
    this.props.updatedAt = now;
    
    // Add domain event for email verification
    this.addDomainEvent(new EmailVerifiedEvent(this.id, this.props.email.email, now));
  }



  isValid(): boolean {
    try {
      // Check if email is valid
      if (!this.props.email) return false;
      
      // Check if name is not empty (if provided)
      if (this.props.name !== undefined && this.props.name.trim() === '') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  updatePreferences(newPreferences: Record<string, any>): void {
    this.props.preferences = {
      ...this.props.preferences,
      ...newPreferences,
    };
    this.props.updatedAt = new Date();
  }

  getPreference(key: string): any {
    return this.props.preferences?.[key];
  }

  recordLogin(ipAddress: string, userAgent: string): void {
    this.props.lastLoginAt = new Date();
    this.props.lastLoginIp = ipAddress;
    this.props.lastLoginUserAgent = userAgent;
    this.props.loginCount = (this.props.loginCount || 0) + 1;
    this.props.updatedAt = new Date();
  }

  requirePasswordChange(): void {
    this.props.passwordChangeRequired = true;
    this.props.updatedAt = new Date();
  }

  updatePassword(newPassword: string): void {
    // In a real implementation, you would hash the password here
    // For testing purposes, we'll store a simple hash
    this.props.passwordHash = `hashed_${newPassword}`;
    this.props.passwordUpdatedAt = new Date();
    this.props.passwordChangeRequired = false;
    this.props.updatedAt = new Date();
  }

  verifyPassword(password: string): boolean {
    if (!this.props.passwordHash) {
      return false;
    }
    // Simple verification for testing - in real implementation use proper hashing
    return this.props.passwordHash === `hashed_${password}`;
  }

  suspend(reason: string, suspendedUntil: Date): void {
    this.props.suspendedAt = new Date();
    this.props.suspendedUntil = suspendedUntil;
    this.props.suspensionReason = reason;
    this.props.updatedAt = new Date();
    
    // Add domain event for suspension
    this.addDomainEvent(new UserSuspendedEvent(this.id, reason, suspendedUntil));
  }

  unsuspend(): void {
    this.props.suspendedAt = undefined;
    this.props.suspendedUntil = undefined;
    this.props.suspensionReason = undefined;
    this.props.updatedAt = new Date();
  }

  isSuspended(): boolean {
    if (!this.props.suspendedAt || !this.props.suspendedUntil) {
      return false;
    }
    
    // Check if suspension has expired
    return new Date() < this.props.suspendedUntil;
  }

  isSuspensionExpired(): boolean {
    if (!this.props.suspendedAt || !this.props.suspendedUntil) {
      return false;
    }
    
    return new Date() >= this.props.suspendedUntil;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.deactivatedAt = new Date();
    this.props.updatedAt = new Date();
    
    // Add domain event for deactivation
    this.addDomainEvent(new UserDeactivatedEvent(this.id, this.props.deactivatedAt));
  }

  reactivate(): void {
    this.props.isActive = true;
    this.props.deactivatedAt = undefined;
    this.props.updatedAt = new Date();
  }



  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  isModerator(): boolean {
    return this.props.role === UserRole.MODERATOR;
  }

  promoteToAdmin(): void {
    const oldRole = this.props.role;
    this.props.role = UserRole.ADMIN;
    this.props.updatedAt = new Date();
    
    // Add domain event for role change
    this.addDomainEvent(new UserRoleChangedEvent(this.id, oldRole, UserRole.ADMIN));
  }

  demoteToUser(): void {
    const oldRole = this.props.role;
    this.props.role = UserRole.USER;
    this.props.updatedAt = new Date();
    
    // Add domain event for role change
    this.addDomainEvent(new UserRoleChangedEvent(this.id, oldRole, UserRole.USER));
  }

  assignRole(role: UserRole): void {
    const oldRole = this.props.role;
    this.props.role = role;
    this.props.updatedAt = new Date();
    
    // Add domain event for role change
    this.addDomainEvent(new UserRoleChangedEvent(this.id, oldRole, role));
  }

  updateAvatar(avatarUrl: string): void {
    this.props.imageUrl = avatarUrl;
    this.props.updatedAt = new Date();
  }

  removeAvatar(): void {
    this.props.imageUrl = undefined;
    this.props.updatedAt = new Date();
  }

  updateName(newName: string): void {
    if (newName.trim() === '') {
      throw new ValidationError('name', 'Name cannot be empty');
    }
    this.props.name = newName;
    this.props.updatedAt = new Date();
  }

  public equals(entity: User): boolean {
    if (!(entity instanceof User)) {
      return false;
    }
    return this._id.equals(entity._id);
  }

  // Static factory methods
  static fromPersistence(data: any): User {
    return new User(
      {
        clerkId: data.clerkId,
        email: new Email(data.email),
        name: data.name,
        username: data.username,
        imageUrl: data.imageUrl,
        bio: data.bio,
        location: data.location,
        website: data.website,
        role: data.role as UserRole,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      },
      new UniqueId(data.id)
    );
  }
}