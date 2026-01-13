import { AggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { DashboardId } from '../value-objects/dashboard-id';

/**
 * Dashboard Domain Events
 */
class DashboardCreatedEvent extends DomainEvent {
  constructor(dashboardId: string, name: string) {
    super();
    Object.assign(this, { dashboardId, name });
  }

  getEventName(): string {
    return 'DashboardCreated';
  }
}

class DashboardUpdatedEvent extends DomainEvent {
  constructor(dashboardId: string, name: string) {
    super();
    Object.assign(this, { dashboardId, name });
  }

  getEventName(): string {
    return 'DashboardUpdated';
  }
}

class DashboardDeletedEvent extends DomainEvent {
  constructor(dashboardId: string, name: string) {
    super();
    Object.assign(this, { dashboardId, name });
  }

  getEventName(): string {
    return 'DashboardDeleted';
  }
}

/**
 * Dashboard Status Enum
 */
export enum DashboardStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Dashboard Props Interface
 */
export interface DashboardProps {
  name: string;
  description?: string;
  layout: string;
  settings: string;
  isPublic: boolean;
  isTemplate: boolean;
  tags: string;
  organizationId: string;
  createdBy: string;
  status: DashboardStatus;
}

/**
 * Dashboard Aggregate Root
 * Represents an analytics dashboard in the analytics domain
 */
export class Dashboard extends AggregateRoot<UniqueId> {
  private constructor(private props: DashboardProps, id?: UniqueId) {
    super(id || UniqueId.create());
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get layout(): string {
    return this.props.layout;
  }

  get settings(): string {
    return this.props.settings;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get isTemplate(): boolean {
    return this.props.isTemplate;
  }

  get tags(): string {
    return this.props.tags;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get status(): DashboardStatus {
    return this.props.status;
  }

  // Business Methods

  /**
   * Update dashboard details
   */
  updateDetails(updates: Partial<DashboardProps>): void {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.layout !== undefined) {
      this.props.layout = updates.layout;
    }
    if (updates.settings !== undefined) {
      this.props.settings = updates.settings;
    }
    if (updates.isPublic !== undefined) {
      this.props.isPublic = updates.isPublic;
    }
    if (updates.isTemplate !== undefined) {
      this.props.isTemplate = updates.isTemplate;
    }
    if (updates.tags !== undefined) {
      this.props.tags = updates.tags;
    }

    this.addDomainEvent(new DashboardUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Activate dashboard
   */
  activate(): void {
    if (this.props.status === DashboardStatus.ACTIVE) {
      return; // Already active
    }

    this.props.status = DashboardStatus.ACTIVE;
    this.addDomainEvent(new DashboardUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Deactivate dashboard
   */
  deactivate(): void {
    if (this.props.status === DashboardStatus.INACTIVE) {
      return; // Already inactive
    }

    this.props.status = DashboardStatus.INACTIVE;
    this.addDomainEvent(new DashboardUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Archive dashboard
   */
  archive(): void {
    if (this.props.status === DashboardStatus.ARCHIVED) {
      return; // Already archived
    }

    this.props.status = DashboardStatus.ARCHIVED;
    this.addDomainEvent(new DashboardUpdatedEvent(
      this.id.value,
      this.props.name
    ));
  }

  /**
   * Check if dashboard is active
   */
  isActive(): boolean {
    return this.props.status === DashboardStatus.ACTIVE;
  }

  /**
   * Check if dashboard is inactive
   */
  isInactive(): boolean {
    return this.props.status === DashboardStatus.INACTIVE;
  }

  /**
   * Check if dashboard is archived
   */
  isArchived(): boolean {
    return this.props.status === DashboardStatus.ARCHIVED;
  }

  /**
   * Check if dashboard is public
   */
  isPublicDashboard(): boolean {
    return this.props.isPublic;
  }

  /**
   * Check if dashboard is template
   */
  isTemplateDashboard(): boolean {
    return this.props.isTemplate;
  }

  /**
   * Create a new Dashboard (factory method)
   */
  static create(props: DashboardProps): Dashboard {
    const dashboard = new Dashboard(props);
    dashboard.addDomainEvent(new DashboardCreatedEvent(
      dashboard.id.value,
      props.name
    ));
    return dashboard;
  }

  /**
   * Reconstitute Dashboard from persistence (factory method)
   */
  static reconstitute(id: UniqueId, props: DashboardProps): Dashboard {
    return new Dashboard(props, id);
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id.value,
      name: this.props.name,
      description: this.props.description,
      layout: this.props.layout,
      settings: this.props.settings,
      isPublic: this.props.isPublic,
      isTemplate: this.props.isTemplate,
      tags: this.props.tags,
      organizationId: this.props.organizationId,
      createdBy: this.props.createdBy,
      status: this.props.status,
    };
  }
}
