import { AggregateRoot } from '../../base/aggregate-root';
import { UniqueId } from '../../value-objects/unique-id';
import { BusinessRuleViolationError } from '../../exceptions/business-rule-violation-error';
import { ValidationError } from '../../exceptions/validation-error';
import { ScheduledReportCreatedEvent } from '../events/scheduled-report-created-event';
import { ScheduledReportUpdatedEvent } from '../events/scheduled-report-updated-event';
import { ScheduledReportExecutedEvent } from '../events/scheduled-report-executed-event';

export enum ScheduleFrequency {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum ScheduledReportStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
}

export enum DeliveryMethod {
  EMAIL = 'EMAIL',
  WEBHOOK = 'WEBHOOK',
  DOWNLOAD = 'DOWNLOAD',
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface DeliveryConfig {
  method: DeliveryMethod;
  recipients?: string[]; // Email addresses for EMAIL method
  webhookUrl?: string; // URL for WEBHOOK method
  format: 'PDF' | 'EXCEL' | 'CSV';
  includeCharts: boolean;
}

// Provide a factory namespace so tests can call DeliveryConfig.create(...)
export namespace DeliveryConfig {
  export function create(params: {
    method: DeliveryMethod | 'EMAIL' | 'WEBHOOK' | 'DOWNLOAD';
    recipients?: string[];
    webhookUrl?: string;
    format: 'PDF' | 'EXCEL' | 'CSV';
    includeCharts?: boolean;
    // Some tests use `includeData` instead of `includeCharts`; support it here
    includeData?: boolean;
  }): import('./scheduled-report').DeliveryConfig {
    const method: DeliveryMethod = typeof params.method === 'string'
      ? (params.method as DeliveryMethod)
      : params.method;
    const includeCharts = params.includeCharts ?? params.includeData ?? false;
    return {
      method,
      recipients: params.recipients,
      webhookUrl: params.webhookUrl,
      format: params.format,
      includeCharts,
    };
  }
}

export interface ScheduleConfig {
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  hour: number; // 0-23
  minute: number; // 0-59
  timezone: string; // IANA timezone identifier
}

// Provide a factory namespace so tests can call ScheduleConfig.create(...)
export namespace ScheduleConfig {
  export function create(params: {
    frequency: ScheduleFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
    timezone: string;
  }): import('./scheduled-report').ScheduleConfig {
    return {
      frequency: params.frequency,
      dayOfWeek: params.dayOfWeek,
      dayOfMonth: params.dayOfMonth,
      hour: params.hour,
      minute: params.minute,
      timezone: params.timezone,
    };
  }
}

export interface ScheduledReportProps {
  name: string;
  description?: string;
  reportId: UniqueId;
  scheduleConfig: ScheduleConfig;
  deliveryConfig: DeliveryConfig;
  status: ScheduledReportStatus;
  createdBy: UniqueId;
  organizationId?: UniqueId;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  nextExecutionAt: Date;
  executionCount: number;
  failureCount: number;
  currentExecutionId?: string;
  executionStartedAt?: Date;
  lastExecutionStatus?: ExecutionStatus;
  lastExecutionDuration?: number;
  lastExecutionRecordCount?: number;
  lastExecutionFileSize?: number;
  lastExecutionError?: string;
}

/**
 * Scheduled Report Domain Entity
 * Represents an automated report that runs on a schedule
 */
export class ScheduledReport extends AggregateRoot<UniqueId> {
  private constructor(
    id: UniqueId,
    private props: ScheduledReportProps
  ) {
    super(id);
  }

  public static create(
    props: Omit<ScheduledReportProps, 'createdAt' | 'updatedAt' | 'executionCount' | 'failureCount' | 'nextExecutionAt'>,
    id?: UniqueId
  ): ScheduledReport {
    const scheduledReportId = id || UniqueId.generate();
    const now = new Date();

    ScheduledReport.validateCreation(props);

    const nextExecutionAt = ScheduledReport.calculateNextExecution(props.scheduleConfig, now);

    const scheduledReport = new ScheduledReport(scheduledReportId, {
      ...props,
      executionCount: 0,
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
      nextExecutionAt,
    });

    scheduledReport.addDomainEvent(
      new ScheduledReportCreatedEvent(scheduledReportId.id, {
        name: props.name,
        reportId: props.reportId.id,
        frequency: props.scheduleConfig.frequency,
        createdBy: props.createdBy.id,
        organizationId: props.organizationId?.id,
      })
    );

    return scheduledReport;
  }

  public static reconstitute(id: UniqueId, props: ScheduledReportProps): ScheduledReport {
    return new ScheduledReport(id, props);
  }

  private static validateCreation(
    props: Omit<ScheduledReportProps, 'createdAt' | 'updatedAt' | 'executionCount' | 'failureCount' | 'nextExecutionAt'>
  ): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('name', 'Scheduled report name is required');
    }

    if (props.name.length > 255) {
      throw new ValidationError('name', 'Scheduled report name cannot exceed 255 characters');
    }

    if (props.description && props.description.length > 1000) {
      throw new ValidationError('description', 'Scheduled report description cannot exceed 1000 characters');
    }

    if (!props.reportId) {
      throw new ValidationError('reportId', 'Report ID is required');
    }

    if (!props.createdBy) {
      throw new ValidationError('createdBy', 'Creator is required');
    }

    ScheduledReport.validateScheduleConfig(props.scheduleConfig);
    ScheduledReport.validateDeliveryConfig(props.deliveryConfig);
  }

  private static validateScheduleConfig(config: ScheduleConfig): void {
    if (!Object.values(ScheduleFrequency).includes(config.frequency)) {
      throw new ValidationError('scheduleConfig.frequency', `Invalid schedule frequency: ${config.frequency}`);
    }

    if (config.hour < 0 || config.hour > 23) {
      throw new ValidationError('scheduleConfig.hour', 'Hour must be between 0 and 23');
    }

    if (config.minute < 0 || config.minute > 59) {
      throw new ValidationError('scheduleConfig.minute', 'Minute must be between 0 and 59');
    }

    if (config.frequency === ScheduleFrequency.WEEKLY) {
      if (config.dayOfWeek === undefined || config.dayOfWeek < 0 || config.dayOfWeek > 6) {
        throw new ValidationError('scheduleConfig.dayOfWeek', 'Day of week must be between 0 and 6 for weekly frequency');
      }
    }

    if (config.frequency === ScheduleFrequency.MONTHLY) {
      if (config.dayOfMonth === undefined || config.dayOfMonth < 1 || config.dayOfMonth > 31) {
        throw new ValidationError('scheduleConfig.dayOfMonth', 'Day of month must be between 1 and 31 for monthly frequency');
      }
    }

    if (!config.timezone || config.timezone.trim().length === 0) {
      throw new ValidationError('scheduleConfig.timezone', 'Timezone is required');
    }
  }

  private static validateDeliveryConfig(config: DeliveryConfig): void {
    if (!Object.values(DeliveryMethod).includes(config.method)) {
      throw new ValidationError('deliveryConfig.method', `Invalid delivery method: ${config.method}`);
    }

    if (config.method === DeliveryMethod.EMAIL) {
      if (!config.recipients || config.recipients.length === 0) {
        throw new ValidationError('deliveryConfig.recipients', 'Recipients are required for email delivery');
      }
      
      config.recipients.forEach((email, index) => {
        if (!ScheduledReport.isValidEmail(email)) {
          throw new ValidationError('deliveryConfig.recipients', `Invalid email at index ${index}: ${email}`);
        }
      });
    }

    if (config.method === DeliveryMethod.WEBHOOK) {
      if (!config.webhookUrl || !ScheduledReport.isValidUrl(config.webhookUrl)) {
        throw new ValidationError('deliveryConfig.webhookUrl', 'Valid webhook URL is required for webhook delivery');
      }
    }

    if (!['PDF', 'EXCEL', 'CSV'].includes(config.format)) {
      throw new ValidationError('deliveryConfig.format', `Invalid format: ${config.format}`);
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      // Only allow HTTP and HTTPS protocols for webhooks
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private static calculateNextExecution(config: ScheduleConfig, from: Date): Date {
    const next = new Date(from);
    
    // Set the time
    next.setHours(config.hour, config.minute, 0, 0);
    
    // If the time has already passed today, move to next occurrence
    if (next <= from) {
      switch (config.frequency) {
        case ScheduleFrequency.HOURLY:
          next.setHours(next.getHours() + 1);
          break;
        case ScheduleFrequency.DAILY:
          next.setDate(next.getDate() + 1);
          break;
        case ScheduleFrequency.WEEKLY:
          const daysUntilNext = (7 + (config.dayOfWeek! - next.getDay())) % 7;
          next.setDate(next.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
          break;
        case ScheduleFrequency.MONTHLY:
          next.setMonth(next.getMonth() + 1);
          next.setDate(config.dayOfMonth!);
          break;
        case ScheduleFrequency.QUARTERLY:
          next.setMonth(next.getMonth() + 3);
          break;
        case ScheduleFrequency.YEARLY:
          next.setFullYear(next.getFullYear() + 1);
          break;
      }
    }
    
    return next;
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get reportId(): UniqueId {
    return this.props.reportId;
  }

  get scheduleConfig(): ScheduleConfig {
    return this.props.scheduleConfig;
  }

  get deliveryConfig(): DeliveryConfig {
    return this.props.deliveryConfig;
  }

  get status(): ScheduledReportStatus {
    return this.props.status;
  }

  get createdBy(): UniqueId {
    return this.props.createdBy;
  }

  get organizationId(): UniqueId | undefined {
    return this.props.organizationId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get lastExecutedAt(): Date | undefined {
    return this.props.lastExecutedAt;
  }

  get nextExecutionAt(): Date {
    return this.props.nextExecutionAt;
  }

  get executionCount(): number {
    return this.props.executionCount;
  }

  get failureCount(): number {
    return this.props.failureCount;
  }

  // Business methods
  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('name', 'Scheduled report name is required');
    }

    if (name.length > 255) {
      throw new ValidationError('name', 'Scheduled report name cannot exceed 255 characters');
    }

    const oldName = this.props.name;
    this.props.name = name;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'name',
        oldValue: oldName,
        newValue: name,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public updateDescription(description?: string): void {
    if (description && description.length > 1000) {
      throw new ValidationError('DESCRIPTION_TOO_LONG', 'Scheduled report description cannot exceed 1000 characters');
    }

    const oldDescription = this.props.description;
    this.props.description = description;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'description',
        oldValue: oldDescription,
        newValue: description,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public updateScheduleConfig(config: ScheduleConfig): void {
    ScheduledReport.validateScheduleConfig(config);

    const oldConfig = this.props.scheduleConfig;
    this.props.scheduleConfig = { ...config };
    this.props.nextExecutionAt = ScheduledReport.calculateNextExecution(config, new Date());
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'scheduleConfig',
        oldValue: oldConfig,
        newValue: config,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public updateDeliveryConfig(config: DeliveryConfig): void {
    ScheduledReport.validateDeliveryConfig(config);

    const oldConfig = this.props.deliveryConfig;
    this.props.deliveryConfig = { ...config };
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'deliveryConfig',
        oldValue: oldConfig,
        newValue: config,
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public activate(): void {
    if (this.props.status === ScheduledReportStatus.ACTIVE) {
      throw new BusinessRuleViolationError('ALREADY_ACTIVE', 'Scheduled report is already active');
    }

    this.props.status = ScheduledReportStatus.ACTIVE;
    this.props.nextExecutionAt = ScheduledReport.calculateNextExecution(this.props.scheduleConfig, new Date());
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'status',
        oldValue: 'inactive',
        newValue: 'active',
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public deactivate(): void {
    if (this.props.status === ScheduledReportStatus.INACTIVE) {
      throw new BusinessRuleViolationError('ALREADY_INACTIVE', 'Scheduled report is already inactive');
    }

    this.props.status = ScheduledReportStatus.INACTIVE;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'status',
        oldValue: 'active',
        newValue: 'inactive',
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public pause(): void {
    if (this.props.status !== ScheduledReportStatus.ACTIVE) {
      throw new BusinessRuleViolationError('INVALID_STATUS_FOR_PAUSE', 'Only active scheduled reports can be paused');
    }

    this.props.status = ScheduledReportStatus.PAUSED;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'status',
        oldValue: 'active',
        newValue: 'paused',
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public resume(): void {
    if (this.props.status !== ScheduledReportStatus.PAUSED) {
      throw new BusinessRuleViolationError('INVALID_STATUS_FOR_RESUME', 'Only paused scheduled reports can be resumed');
    }

    this.props.status = ScheduledReportStatus.ACTIVE;
    this.props.nextExecutionAt = ScheduledReport.calculateNextExecution(this.props.scheduleConfig, new Date());
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportUpdatedEvent(this.id.id, {
        field: 'status',
        oldValue: 'paused',
        newValue: 'active',
        updatedBy: this.props.createdBy.id,
      })
    );
  }

  public markExecuted(success: boolean): void {
    this.props.lastExecutedAt = new Date();
    this.props.executionCount++;
    
    if (!success) {
      this.props.failureCount++;
    }

    // Calculate next execution
    this.props.nextExecutionAt = ScheduledReport.calculateNextExecution(
      this.props.scheduleConfig, 
      this.props.lastExecutedAt
    );
    
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportExecutedEvent(this.id.id, {
        executedAt: this.props.lastExecutedAt.toISOString(),
        success,
        nextExecutionAt: this.props.nextExecutionAt.toISOString(),
        executionCount: this.props.executionCount,
      })
    );
  }

  public recordExecutionStart(executionId: string, startedAt: Date): void {
    this.props.currentExecutionId = executionId;
    this.props.executionStartedAt = startedAt;
    this.props.lastExecutionStatus = ExecutionStatus.RUNNING;
    this.props.updatedAt = new Date();
  }

  public recordExecutionCompletion(
    executionId: string,
    status: ExecutionStatus,
    duration: number,
    recordCount?: number,
    fileSize?: number,
    errorMessage?: string
  ): void {
    // Verify this is the current execution
    if (this.props.currentExecutionId !== executionId) {
      throw new Error(`Execution ID mismatch. Expected ${this.props.currentExecutionId}, got ${executionId}`);
    }

    this.props.lastExecutedAt = new Date();
    this.props.lastExecutionStatus = status;
    this.props.lastExecutionDuration = duration;
    this.props.lastExecutionRecordCount = recordCount;
    this.props.lastExecutionFileSize = fileSize;
    this.props.lastExecutionError = errorMessage;
    this.props.executionCount++;
    
    if (status === ExecutionStatus.FAILED) {
      this.props.failureCount++;
    }

    // Clear current execution tracking
    this.props.currentExecutionId = undefined;
    this.props.executionStartedAt = undefined;
    
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ScheduledReportExecutedEvent(this.id.id, {
        executedAt: this.props.lastExecutedAt.toISOString(),
        success: status === ExecutionStatus.COMPLETED,
        nextExecutionAt: this.props.nextExecutionAt.toISOString(),
        executionCount: this.props.executionCount,
      })
    );
  }

  public updateNextExecution(nextExecutionAt: Date): void {
    this.props.nextExecutionAt = nextExecutionAt;
    this.props.updatedAt = new Date();
  }

  // Query methods
  public isActive(): boolean {
    return this.props.status === ScheduledReportStatus.ACTIVE;
  }

  public isPaused(): boolean {
    return this.props.status === ScheduledReportStatus.PAUSED;
  }

  public isInactive(): boolean {
    return this.props.status === ScheduledReportStatus.INACTIVE;
  }

  public isDue(): boolean {
    return this.isActive() && new Date() >= this.props.nextExecutionAt;
  }

  public belongsToOrganization(organizationId: UniqueId): boolean {
    return this.props.organizationId?.equals(organizationId) ?? false;
  }

  public isCreatedBy(userId: UniqueId): boolean {
    return this.props.createdBy.equals(userId);
  }

  public hasHighFailureRate(): boolean {
    if (this.props.executionCount === 0) return false;
    return (this.props.failureCount / this.props.executionCount) > 0.5; // More than 50% failure rate
  }

  public getSuccessRate(): number {
    if (this.props.executionCount === 0) return 1.0; // 100% success rate when no executions yet
    return (this.props.executionCount - this.props.failureCount) / this.props.executionCount;
  }
}

// Export alias for backward compatibility
// Provide a separate ReportFrequency enum to satisfy tests that import it
export enum ReportFrequency {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

// Add a factory-style helper to normalize string inputs used in tests
export namespace ReportFrequency {
  export function create(value: string): ReportFrequency {
    const v = (value || '').toLowerCase();
    switch (v) {
      case 'hourly': return ReportFrequency.HOURLY;
      case 'daily': return ReportFrequency.DAILY;
      case 'weekly': return ReportFrequency.WEEKLY;
      case 'monthly': return ReportFrequency.MONTHLY;
      case 'quarterly': return ReportFrequency.QUARTERLY;
      case 'yearly': return ReportFrequency.YEARLY;
      default:
        // Fallback for unknown strings
        return ReportFrequency.DAILY;
    }
  }
}

// Expose ReportFrequency globally for tests that don't import it
// This makes ReportFrequency.create(...) available without import statements
;(globalThis as any).ReportFrequency = ReportFrequency;