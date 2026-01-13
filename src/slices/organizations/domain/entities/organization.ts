import { AggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { OrganizationId } from '../value-objects/organization-id';

/**
 * Organization Role Enum
 */
export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/**
 * Organization Status Enum
 */
export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Organization Props Interface
 */
export interface OrganizationProps {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  role: OrganizationRole;
  status: OrganizationStatus;
  maxMembers: number;
  plan: string;
  settings: string;
}

/**
 * Organization Domain Events
 */
class OrganizationCreatedEvent extends DomainEvent {
  constructor(organizationId: string, name: string) {
    super();
    Object.assign(this, { organizationId, name });
  }

  getEventName(): string {
    return 'OrganizationCreated';
  }
}

class OrganizationUpdatedEvent extends DomainEvent {
  constructor(organizationId: string, name: string) {
    super();
    Object.assign(this, { organizationId, name });
  }

  getEventName(): string {
    return 'OrganizationUpdated';
  }
}

class OrganizationDeletedEvent extends DomainEvent {
  constructor(organizationId: string, name: string) {
    super();
    Object.assign(this, { organizationId, name });
  }

  getEventName(): string {
    return 'OrganizationDeleted';
  }
}

class OrganizationSuspendedEvent extends DomainEvent {
  constructor(organizationId: string, name: string) {
    super();
    Object.assign(this, { organizationId, name });
  }

  getEventName(): string {
    return 'OrganizationSuspended';
  }
}

class OrganizationActivatedEvent extends DomainEvent {
  constructor(organizationId: string, name: string) {
    super();
    Object.assign(this, { organizationId, name });
  }

  getEventName(): string {
    return 'OrganizationActivated';
  }
}

class OrganizationArchivedEvent extends DomainEvent {
  constructor(organizationId: string, name: string) {
    super();
    Object.assign(this, { organizationId, name });
  }

  getEventName(): string {
    return 'OrganizationArchived';
  }
}

class OrganizationMemberAddedEvent extends DomainEvent {
  constructor(organizationId: string, userId: string) {
    super();
    Object.assign(this, { organizationId, userId });
  }

  getEventName(): string {
    return 'OrganizationMemberAdded';
  }
}

class OrganizationMemberRemovedEvent extends DomainEvent {
  constructor(organizationId: string, userId: string) {
    super();
    Object.assign(this, { organizationId, userId });
  }

  getEventName(): string {
    return 'OrganizationMemberRemoved';
  }
}

/**
 * Organization Aggregate Root
 * Represents an organization in the organizations domain
 */
export class Organization extends AggregateRoot<UniqueId> {
  private constructor(private props: OrganizationProps, id?: UniqueId) {
    super(id || UniqueId.create());
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get role(): OrganizationRole {
    return this.props.role;
  }

  get status(): OrganizationStatus {
    return this.props.status;
  }

  get maxMembers(): number {
    return this.props.maxMembers;
  }

  get plan(): string {
    return this.props.plan;
  }

  get settings(): string {
    return this.props.settings;
  }

  // Business Methods

  /**
   * Update organization details
   */
  updateDetails(updates: Partial<OrganizationProps>): void {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.imageUrl !== undefined) {
      this.props.imageUrl = updates.imageUrl;
    }
    if (updates.website !== undefined) {
      this.props.website = updates.website;
    }
    if (updates.plan !== undefined) {
      this.props.plan = updates.plan;
    }
    if (updates.settings !== undefined) {
      this.props.settings = updates.settings;
    }
  }

  /**
   * Activate organization
   */
  activate(): void {
    if (this.props.status === OrganizationStatus.ACTIVE) {
      return; // Already active
    }

    this.props.status = OrganizationStatus.ACTIVE;
    this.addDomainEvent(new OrganizationActivatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Deactivate organization
   */
  deactivate(): void {
    if (this.props.status === OrganizationStatus.INACTIVE) {
      return; // Already inactive
    }

    this.props.status = OrganizationStatus.INACTIVE;
    this.addDomainEvent(new OrganizationUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Suspend organization
   */
  suspend(reason?: string): void {
    if (this.props.status === OrganizationStatus.SUSPENDED) {
      return; // Already suspended
    }

    this.props.status = OrganizationStatus.SUSPENDED;
    this.addDomainEvent(new OrganizationSuspendedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Archive organization
   */
  archive(): void {
    if (this.props.status === OrganizationStatus.ARCHIVED) {
      return; // Already archived
    }

    this.props.status = OrganizationStatus.ARCHIVED;
    this.addDomainEvent(new OrganizationArchivedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Update organization plan
   */
  updatePlan(plan: string): void {
    this.props.plan = plan;
    this.addDomainEvent(new OrganizationUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Update organization settings
   */
  updateSettings(settings: string): void {
    this.props.settings = settings;
  this.addDomainEvent(new OrganizationUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Check if organization is active
   */
  isActive(): boolean {
    return this.props.status === OrganizationStatus.ACTIVE;
  }

  /**
   * Check if organization is inactive
   */
  isInactive(): boolean {
    return this.props.status === OrganizationStatus.INACTIVE;
  }

  /**
   * Check if organization is suspended
   */
  isSuspended(): boolean {
    return this.props.status === OrganizationStatus.SUSPENDED;
  }

  /**
   * Check if organization is archived
   */
  isArchived(): boolean {
    return this.props.status === OrganizationStatus.ARCHIVED;
  }

  /**
   * Check if user can be owner
   */
  isOwner(): boolean {
    return this.props.role === OrganizationRole.OWNER;
  }

  /**
   * Check if user can be admin
   */
  isAdmin(): boolean {
    return this.props.role === OrganizationRole.ADMIN;
  }

  /**
   * Check if user can be member
   */
  isMember(): boolean {
    return this.props.role === OrganizationRole.MEMBER;
  }

  /**
   * Check if user can be viewer
   */
  isViewer(): boolean {
    return this.props.role === OrganizationRole.VIEWER;
  }

  /**
   * Create a new Organization (factory method)
   */
  static create(props: OrganizationProps): Organization {
    const organization = new Organization(props);
    organization.addDomainEvent(new OrganizationCreatedEvent(
      organization.id.value,
      props.name
    ));
    return organization;
  }

  /**
   * Reconstitute Organization from persistence (factory method)
   */
  static reconstitute(id: UniqueId, props: OrganizationProps): Organization {
    return new Organization(props, id);
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      name: this.props.name,
      slug: this.props.slug,
      description: this.props.description,
      imageUrl: this.props.imageUrl,
      website: this.props.website,
      role: this.props.role,
      status: this.props.status,
      maxMembers: this.props.maxMembers,
      plan: this.props.plan,
      settings: this.props.settings,
    };
  }
}
