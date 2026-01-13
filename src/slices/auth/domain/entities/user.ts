import { AggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';

/**
 * User Role Enum
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/**
 * User Status Enum
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * User Props Interface
 */
export interface UserProps {
  clerkId?: string;
  email: Email;
  passwordHash?: PasswordHash;
  name?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}

/**
 * User Domain Events
 */
class UserRegisteredEvent extends DomainEvent {
  constructor(userId: string, email: string) {
    super();
    Object.assign(this, { userId, email });
  }

  getEventName(): string {
    return 'UserRegistered';
  }
}

class UserLoggedInEvent extends DomainEvent {
  constructor(userId: string, sessionId: string) {
    super();
    Object.assign(this, { userId, sessionId });
  }

  getEventName(): string {
    return 'UserLoggedIn';
  }
}

class UserLoggedOutEvent extends DomainEvent {
  constructor(userId: string, sessionId: string) {
    super();
    Object.assign(this, { userId, sessionId });
  }

  getEventName(): string {
    return 'UserLoggedOut';
  }
}

class UserEmailVerifiedEvent extends DomainEvent {
  constructor(userId: string, email: string) {
    super();
    Object.assign(this, { userId, email });
  }

  getEventName(): string {
    return 'UserEmailVerified';
  }
}

class UserPasswordChangedEvent extends DomainEvent {
  constructor(userId: string) {
    super();
    Object.assign(this, { userId });
  }

  getEventName(): string {
    return 'UserPasswordChanged';
  }
}

class UserStatusChangedEvent extends DomainEvent {
  constructor(userId: string, previousStatus: UserStatus, newStatus: UserStatus) {
    super();
    Object.assign(this, { userId, previousStatus, newStatus });
  }

  getEventName(): string {
    return 'UserStatusChanged';
  }
}

class UserRoleChangedEvent extends DomainEvent {
  constructor(userId: string, previousRole: UserRole, newRole: UserRole) {
    super();
    Object.assign(this, { userId, previousRole, newRole });
  }

  getEventName(): string {
    return 'UserRoleChanged';
  }
}

/**
 * User Aggregate Root
 * Represents a user in the authentication domain
 */
export class User extends AggregateRoot<UniqueId> {
  private constructor(private props: UserProps, id?: UniqueId) {
    super(id || UniqueId.create());
  }

  // Getters
  get clerkId(): string | undefined {
    return this.props.clerkId;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash | undefined {
    return this.props.passwordHash;
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

  get status(): UserStatus {
    return this.props.status;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  // Business Methods

  /**
   * Verify user's email
   */
  verifyEmail(): void {
    if (this.props.emailVerified) {
      return; // Already verified
    }

    this.props.emailVerified = true;
    this.addDomainEvent(new UserEmailVerifiedEvent(
      this.id.value,
      this.props.email.toString()
    ));
  }

  /**
   * Change user password
   */
  changePassword(newPasswordHash: PasswordHash): void {
    this.props.passwordHash = newPasswordHash;
    this.addDomainEvent(new UserPasswordChangedEvent(this.id.value));
  }

  /**
   * Change user role
   */
  changeRole(newRole: UserRole): void {
    const previousRole = this.props.role;
    this.props.role = newRole;
    this.addDomainEvent(new UserRoleChangedEvent(
      this.id.value,
      previousRole,
      newRole
    ));
  }

  /**
   * Activate user account
   */
  activate(): void {
    if (this.props.status === UserStatus.ACTIVE) {
      return; // Already active
    }

    const previousStatus = this.props.status;
    this.props.status = UserStatus.ACTIVE;
    this.addDomainEvent(new UserStatusChangedEvent(
      this.id.value,
      previousStatus,
      UserStatus.ACTIVE
    ));
  }

  /**
   * Deactivate user account
   */
  deactivate(): void {
    if (this.props.status === UserStatus.INACTIVE) {
      return; // Already inactive
    }

    const previousStatus = this.props.status;
    this.props.status = UserStatus.INACTIVE;
    this.addDomainEvent(new UserStatusChangedEvent(
      this.id.value,
      previousStatus,
      UserStatus.INACTIVE
    ));
  }

  /**
   * Suspend user account
   */
  suspend(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      return; // Already suspended
    }

    const previousStatus = this.props.status;
    this.props.status = UserStatus.SUSPENDED;
    this.addDomainEvent(new UserStatusChangedEvent(
      this.id.value,
      previousStatus,
      UserStatus.SUSPENDED
    ));
  }

  /**
   * Update user profile
   */
  updateProfile(updates: Partial<{
    name: string;
    username: string;
    imageUrl: string;
    bio: string;
    location: string;
    website: string;
  }>): void {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
    }
    if (updates.username !== undefined) {
      this.props.username = updates.username;
    }
    if (updates.imageUrl !== undefined) {
      this.props.imageUrl = updates.imageUrl;
    }
    if (updates.bio !== undefined) {
      this.props.bio = updates.bio;
    }
    if (updates.location !== undefined) {
      this.props.location = updates.location;
    }
    if (updates.website !== undefined) {
      this.props.website = updates.website;
    }
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.props.role === role;
  }

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  /**
   * Check if user is active
   */
  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  /**
   * Check if user is suspended
   */
  isSuspended(): boolean {
    return this.props.status === UserStatus.SUSPENDED;
  }

  /**
   * Check if user can perform admin actions
   */
  canPerformAdminActions(): boolean {
    return this.props.role === UserRole.ADMIN ||
           this.props.role === UserRole.OWNER;
  }

  /**
   * Create a new User (factory method)
   */
  static create(props: UserProps): User {
    const user = new User(props);
    user.addDomainEvent(new UserRegisteredEvent(
      user.id.value,
      props.email.toString()
    ));
    return user;
  }

  /**
   * Reconstitute User from persistence (factory method)
   */
  static reconstitute(id: UniqueId, props: UserProps): User {
    return new User(props, id);
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      clerkId: this.props.clerkId,
      email: this.props.email.toString(),
      passwordHash: this.props.passwordHash?.toString(),
      name: this.props.name,
      username: this.props.username,
      imageUrl: this.props.imageUrl,
      bio: this.props.bio,
      location: this.props.location,
      website: this.props.website,
      role: this.props.role,
      status: this.props.status,
      emailVerified: this.props.emailVerified,
    };
  }
}
