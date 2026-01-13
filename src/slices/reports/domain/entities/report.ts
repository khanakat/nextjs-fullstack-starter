import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { ReportId } from '../value-objects/report-id';

/**
 * Report Status Enum
 */
export enum ReportStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Report Domain Events
 */
class ReportCreatedEvent extends DomainEvent {
  constructor(reportId: string, name: string) {
    super();
    Object.assign(this, { reportId, name });
  }

  getEventName(): string {
    return 'ReportCreated';
  }
}

class ReportUpdatedEvent extends DomainEvent {
  constructor(reportId: string) {
    super();
    Object.assign(this, { reportId });
  }

  getEventName(): string {
    return 'ReportUpdated';
  }
}

class ReportPublishedEvent extends DomainEvent {
  constructor(reportId: string) {
    super();
    Object.assign(this, { reportId });
  }

  getEventName(): string {
    return 'ReportPublished';
  }
}

class ReportArchivedEvent extends DomainEvent {
  constructor(reportId: string) {
    super();
    Object.assign(this, { reportId });
  }

  getEventName(): string {
    return 'ReportArchived';
  }
}

/**
 * Report Props Interface
 */
export interface ReportProps {
  name: string;
  description?: string | null;
  templateId?: string | null;
  config: Record<string, unknown>;
  createdBy: string;
  isPublic: boolean;
  status: ReportStatus;
  organizationId?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Report Aggregate Root
 * Represents a report in the domain
 */
export class Report {
  private _domainEvents: DomainEvent[] = [];
  private constructor(private props: ReportProps, private _id: ReportId) {}

  // Getters
  get id(): ReportId {
    return this._id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description || null;
  }

  get templateId(): string | null {
    return this.props.templateId || null;
  }

  get config(): Record<string, unknown> {
    return { ...this.props.config };
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get status(): ReportStatus {
    return this.props.status;
  }

  get organizationId(): string | null {
    return this.props.organizationId || null;
  }

  get createdAt(): Date | null {
    return this.props.createdAt || null;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt || null;
  }

  // Business Methods

  /**
   * Update report configuration
   */
  updateConfig(config: Record<string, unknown>): void {
    this.props.config = { ...this.props.config, ...config };
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ReportUpdatedEvent(this._id.getValue()));
  }

  /**
   * Update report details
   */
  updateDetails(name: string, description?: string): void {
    this.props.name = name;
    this.props.description = description || null;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ReportUpdatedEvent(this._id.getValue()));
  }

  /**
   * Publish report
   */
  publish(): void {
    if (this.props.status === ReportStatus.PUBLISHED) {
      throw new Error('Report is already published');
    }
    this.props.status = ReportStatus.PUBLISHED;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ReportPublishedEvent(this._id.getValue()));
  }

  /**
   * Archive report
   */
  archive(): void {
    if (this.props.status === ReportStatus.ARCHIVED) {
      throw new Error('Report is already archived');
    }
    this.props.status = ReportStatus.ARCHIVED;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new ReportArchivedEvent(this._id.getValue()));
  }

  /**
   * Set as public
   */
  setPublic(): void {
    this.props.isPublic = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Set as private
   */
  setPrivate(): void {
    this.props.isPublic = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if report is draft
   */
  isDraft(): boolean {
    return this.props.status === ReportStatus.DRAFT;
  }

  /**
   * Check if report is published
   */
  isPublished(): boolean {
    return this.props.status === ReportStatus.PUBLISHED;
  }

  /**
   * Check if report is archived
   */
  isArchived(): boolean {
    return this.props.status === ReportStatus.ARCHIVED;
  }

  /**
   * Check if report is public
   */
  isPublicReport(): boolean {
    return this.props.isPublic;
  }

  /**
   * Get config as object
   */
  getConfigAsObject(): Record<string, unknown> {
    return { ...this.props.config };
  }

  /**
   * Add domain event
   */
  private addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Get uncommitted domain events
   */
  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clear domain events (when committed)
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Checks if aggregate has uncommitted events
   */
  public hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Create a new Report (factory method)
   */
  static create(props: Omit<ReportProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Report {
    const id = ReportId.create();
    const report = new Report({
      ...props,
      id,
      status: ReportStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    report.addDomainEvent(new ReportCreatedEvent(id.getValue(), report.name));
    return report;
  }

  /**
   * Reconstitute Report from persistence (factory method)
   */
  static reconstitute(props: ReportProps, id: ReportId): Report {
    return new Report(props, id);
  }

  /**
   * Convert to persistence format
   */
  toPersistence() {
    return {
      id: this._id.getValue(),
      name: this.props.name,
      description: this.props.description,
      templateId: this.props.templateId,
      config: JSON.stringify(this.props.config),
      createdBy: this.props.createdBy,
      isPublic: this.props.isPublic,
      status: this.props.status,
      organizationId: this.props.organizationId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
