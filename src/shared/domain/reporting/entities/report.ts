import { AggregateRoot } from '../../base/aggregate-root';
import { UniqueId } from '../../value-objects/unique-id';
import { ReportConfig } from '../value-objects/report-config';
import { ReportStatus } from '../value-objects/report-status';
import { BusinessRuleViolationError } from '../../exceptions/business-rule-violation-error';
import { ValidationError } from '../../exceptions/validation-error';
import { ReportCreatedEvent } from '../events/report-created-event';
import { ReportUpdatedEvent } from '../events/report-updated-event';
import { ReportPublishedEvent } from '../events/report-published-event';
import { ReportArchivedEvent } from '../events/report-archived-event';

export interface ReportProps {
  title: string;
  description?: string;
  config: ReportConfig;
  content?: any;
  status: ReportStatus;
  isPublic: boolean;
  templateId?: UniqueId;
  createdBy: UniqueId;
  organizationId?: UniqueId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date | null;
}

/**
 * Report Domain Entity
 * Represents a report with its configuration and business rules
 */
export class Report extends AggregateRoot<UniqueId> {
  private constructor(
    id: UniqueId,
    private props: ReportProps
  ) {
    super(id);
  }

  public static create(
    props: Omit<ReportProps, 'createdAt' | 'updatedAt' | 'status'>,
    id?: UniqueId
  ): Report {
    Report.validateCreation(props);

    const reportId = id || UniqueId.generate();
    const now = new Date();

    const reportProps: ReportProps = {
      ...props,
      status: ReportStatus.draft(),
      createdAt: now,
      updatedAt: now,
    };

    const report = new Report(reportId, reportProps);

    report.addDomainEvent(
      new ReportCreatedEvent(reportId.id, {
        title: props.title,
        createdBy: props.createdBy.id,
        organizationId: props.organizationId?.id,
        templateId: props.templateId?.id,
      })
    );

    return report;
  }

  public static reconstitute(id: UniqueId, props: ReportProps): Report {
    return new Report(id, props);
  }

  private static validateCreation(props: Omit<ReportProps, 'createdAt' | 'updatedAt' | 'status'>): void {
    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError('title', 'Report title is required');
    }

    if (props.title.length > 255) {
      throw new ValidationError('title', 'Report title cannot exceed 255 characters');
    }

    if (props.description && props.description.length > 1000) {
      throw new ValidationError('description', 'Report description cannot exceed 1000 characters');
    }

    if (!props.config) {
      throw new ValidationError('config', 'Report configuration is required');
    }

    if (!props.createdBy) {
      throw new ValidationError('createdBy', 'Report creator is required');
    }
  }

  // Getters
  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get config(): ReportConfig {
    return this.props.config;
  }

  get status(): ReportStatus {
    return this.props.status;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get templateId(): UniqueId | null {
    return this.props.templateId || null;
  }

  get createdBy(): UniqueId {
    return this.props.createdBy;
  }

  get organizationId(): UniqueId | null {
    return this.props.organizationId || null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt || null;
  }

  get metadata(): Record<string, any> {
    return { ...(this.props.metadata || {}) };
  }

  get content(): any {
    return this.props.content;
  }

  // Business methods
  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new ValidationError('title', 'Report title is required');
    }

    if (title.length > 255) {
      throw new ValidationError('title', 'Report title cannot exceed 255 characters');
    }

    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    const oldTitle = this.props.title;
    this.props.title = title;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'title',
        oldValue: oldTitle,
        newValue: title,
        updatedBy: this.props.createdBy.id, // In real scenario, this would be the current user
      })
    );
  }

  public updateDescription(description?: string): void {
    if (description && description.length > 1000) {
      throw new ValidationError('description', 'Report description cannot exceed 1000 characters');
    }

    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    const oldDescription = this.props.description;
    this.props.description = description;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'description',
        oldValue: oldDescription,
        newValue: description,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public updateConfig(config: ReportConfig): void {
    if (!config) {
      throw new ValidationError('config', 'Report configuration is required');
    }

    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    if (this.props.status.isPublished()) {
      throw new BusinessRuleViolationError('PUBLISHED_REPORT_CONFIG_IMMUTABLE', 'Cannot update published report configuration');
    }

    const oldConfig = this.props.config;
    this.props.config = config;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'config',
        oldValue: oldConfig,
        newValue: config,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public updateContent(content: any): void {
    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    if (this.props.status.isPublished()) {
      throw new BusinessRuleViolationError('PUBLISHED_REPORT_CONTENT_IMMUTABLE', 'Cannot update published report content');
    }

    const oldContent = this.props.content;
    this.props.content = content;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'content',
        oldValue: oldContent,
        newValue: content,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public updateVisibility(isPublic: boolean): void {
    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    const oldVisibility = this.props.isPublic;
    this.props.isPublic = isPublic;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'visibility',
        oldValue: oldVisibility.toString(),
        newValue: isPublic.toString(),
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public publish(): void {
    if (!this.props.status.isDraft()) {
      throw new BusinessRuleViolationError('INVALID_STATUS_FOR_PUBLISH', 'Only draft reports can be published');
    }

    if (!this.props.config.isValidForPublishing()) {
      throw new BusinessRuleViolationError('INVALID_CONFIG_FOR_PUBLISH', 'Report configuration is not valid for publishing');
    }

    this.props.status = ReportStatus.published();
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportPublishedEvent(this.id.id, {
        title: this.props.title,
        publishedBy: this.props.createdBy.id,
        organizationId: this.props.organizationId?.id,
      })
    );
  }

  public archive(): void {
    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('REPORT_ALREADY_ARCHIVED', 'Report is already archived');
    }

    // Allow archiving from both DRAFT and PUBLISHED states

    this.props.status = ReportStatus.archived();
    this.props.archivedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportArchivedEvent(this.id.id, {
        title: this.props.title,
        archivedBy: this.props.createdBy.id,
        organizationId: this.props.organizationId?.id,
      })
    );
  }

  public restore(): void {
    if (!this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('INVALID_STATUS_FOR_RESTORE', 'Only archived reports can be restored');
    }

    this.props.status = ReportStatus.published();
    this.props.archivedAt = null;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'status',
        oldValue: ReportStatus.ARCHIVED,
        newValue: ReportStatus.DRAFT,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  // Query methods
  public isDraft(): boolean {
    return this.props.status.isDraft();
  }

  public isPublished(): boolean {
    return this.props.status.isPublished();
  }

  public isArchived(): boolean {
    return this.props.status.isArchived();
  }

  public canBeUpdated(): boolean {
    return !this.props.status.isArchived();
  }

  public canBePublished(): boolean {
    return this.props.status.isDraft() && this.props.config.isValidForPublishing();
  }

  public canBeArchived(): boolean {
    return !this.props.status.isArchived();
  }

  public belongsToOrganization(organizationId: UniqueId): boolean {
    return this.props.organizationId?.equals(organizationId) ?? false;
  }

  public isCreatedBy(userId: UniqueId): boolean {
    return this.props.createdBy.equals(userId);
  }

  public hasTemplate(): boolean {
    return this.props.templateId !== undefined;
  }

  public isBasedOnTemplate(templateId: UniqueId): boolean {
    return this.props.templateId?.equals(templateId) ?? false;
  }

  public addMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.props.updatedAt = new Date();
  }

  public removeMetadataKey(key: string): void {
    if (this.props.metadata) {
      const { [key]: removed, ...rest } = this.props.metadata;
      this.props.metadata = rest;
      this.props.updatedAt = new Date();
    }
  }

  public isValid(): boolean {
    try {
      Report.validateCreation({
        title: this.props.title,
        description: this.props.description,
        config: this.props.config,
        isPublic: this.props.isPublic,
        templateId: this.props.templateId,
        createdBy: this.props.createdBy,
        organizationId: this.props.organizationId,
        metadata: this.props.metadata,
      });
      return true;
    } catch {
      return false;
    }
  }

  public equals(other: Report): boolean {
    return this.id.equals(other.id);
  }

  public setTemplate(templateId: UniqueId): void {
    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    const oldTemplateId = this.props.templateId;
    this.props.templateId = templateId;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'templateId',
        oldValue: oldTemplateId?.id,
        newValue: templateId.id,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public removeTemplate(): void {
    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    const oldTemplateId = this.props.templateId;
    this.props.templateId = undefined;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'templateId',
        oldValue: oldTemplateId?.id,
        newValue: undefined,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public setOrganization(organizationId: UniqueId): void {
    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    const oldOrganizationId = this.props.organizationId;
    this.props.organizationId = organizationId;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'organizationId',
        oldValue: oldOrganizationId?.id,
        newValue: organizationId.id,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public removeOrganization(): void {
    if (this.props.status.isArchived()) {
      throw new BusinessRuleViolationError('ARCHIVED_REPORT_IMMUTABLE', 'Cannot update archived report');
    }

    const oldOrganizationId = this.props.organizationId;
    this.props.organizationId = undefined;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ReportUpdatedEvent(this.id.id, {
        field: 'organizationId',
        oldValue: oldOrganizationId?.id,
        newValue: undefined,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public makePublic(): void {
    if (!this.props.status.isPublished()) {
      throw new BusinessRuleViolationError('INVALID_STATUS_FOR_PUBLIC', 'Only published reports can be made public');
    }

    this.updateVisibility(true);
  }

  public makePrivate(): void {
    this.updateVisibility(false);
  }
}

// Re-export ReportStatus for external use
export { ReportStatus };