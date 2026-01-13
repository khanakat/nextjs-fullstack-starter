import { Dto } from '../../../../shared/application/base/dto';
import { ReportFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';

/**
 * Scheduled Report DTO for data transfer between layers
 */
export class ScheduledReportDto extends Dto {
  public readonly name: string;
  public readonly reportId: string;
  public readonly frequency: ReportFrequency;
  public readonly isActive: boolean;
  public readonly nextExecutionAt?: Date;
  public readonly lastExecutionAt?: Date;
  public readonly executionCount: number;
  public readonly failureCount: number;
  public readonly createdBy: string;
  public readonly organizationId?: string;
  public readonly timezone: string;
  public readonly deliveryConfig: DeliveryConfigDto;
  public readonly executionHistory: ExecutionHistoryDto[];

  constructor(
    id: string,
    name: string,
    reportId: string,
    frequency: ReportFrequency,
    isActive: boolean,
    executionCount: number,
    failureCount: number,
    createdBy: string,
    timezone: string,
    deliveryConfig: DeliveryConfigDto,
    executionHistory: ExecutionHistoryDto[],
    createdAt: Date,
    updatedAt?: Date,
    nextExecutionAt?: Date,
    lastExecutionAt?: Date,
    organizationId?: string
  ) {
    super(id, createdAt, updatedAt);
    this.name = name;
    this.reportId = reportId;
    this.frequency = frequency;
    this.isActive = isActive;
    this.nextExecutionAt = nextExecutionAt;
    this.lastExecutionAt = lastExecutionAt;
    this.executionCount = executionCount;
    this.failureCount = failureCount;
    this.createdBy = createdBy;
    this.organizationId = organizationId;
    this.timezone = timezone;
    this.deliveryConfig = deliveryConfig;
    this.executionHistory = executionHistory;
  }

  public toPlainObject(): Record<string, any> {
    return {
      ...super.toPlainObject(),
      name: this.name,
      reportId: this.reportId,
      frequency: this.frequency,
      isActive: this.isActive,
      nextExecutionAt: this.nextExecutionAt,
      lastExecutionAt: this.lastExecutionAt,
      executionCount: this.executionCount,
      failureCount: this.failureCount,
      createdBy: this.createdBy,
      organizationId: this.organizationId,
      timezone: this.timezone,
      deliveryConfig: this.deliveryConfig.toPlainObject(),
      executionHistory: this.executionHistory.map(h => h.toPlainObject()),
    };
  }
}

/**
 * Delivery Configuration DTO
 */
export class DeliveryConfigDto {
  public readonly method: 'email' | 'webhook' | 'file_system' | 'cloud_storage';
  public readonly recipients: string[];
  public readonly format: 'pdf' | 'excel' | 'csv' | 'json';
  public readonly settings: Record<string, any>;

  constructor(
    method: 'email' | 'webhook' | 'file_system' | 'cloud_storage',
    recipients: string[],
    format: 'pdf' | 'excel' | 'csv' | 'json',
    settings: Record<string, any>
  ) {
    this.method = method;
    this.recipients = recipients;
    this.format = format;
    this.settings = settings;
  }

  public toPlainObject(): Record<string, any> {
    return {
      method: this.method,
      recipients: this.recipients,
      format: this.format,
      settings: this.settings,
    };
  }
}

/**
 * Execution History DTO
 */
export class ExecutionHistoryDto {
  public readonly executedAt: Date;
  public readonly success: boolean;
  public readonly errorMessage?: string;
  public readonly executionDuration?: number;
  public readonly deliveryStatus?: 'pending' | 'delivered' | 'failed';
  public readonly deliveryAttempts?: number;

  constructor(
    executedAt: Date,
    success: boolean,
    errorMessage?: string,
    executionDuration?: number,
    deliveryStatus?: 'pending' | 'delivered' | 'failed',
    deliveryAttempts?: number
  ) {
    this.executedAt = executedAt;
    this.success = success;
    this.errorMessage = errorMessage;
    this.executionDuration = executionDuration;
    this.deliveryStatus = deliveryStatus;
    this.deliveryAttempts = deliveryAttempts;
  }

  public toPlainObject(): Record<string, any> {
    return {
      executedAt: this.executedAt,
      success: this.success,
      errorMessage: this.errorMessage,
      executionDuration: this.executionDuration,
      deliveryStatus: this.deliveryStatus,
      deliveryAttempts: this.deliveryAttempts,
    };
  }
}

/**
 * Scheduled Report Statistics DTO
 */
export class ScheduledReportStatisticsDto {
  public readonly totalScheduledReports: number;
  public readonly activeScheduledReports: number;
  public readonly pausedScheduledReports: number;
  public readonly executionsThisMonth: number;
  public readonly executionsThisWeek: number;
  public readonly successRate: number;
  public readonly averageExecutionTime: number;
  public readonly organizationId?: string;

  constructor(
    totalScheduledReports: number,
    activeScheduledReports: number,
    pausedScheduledReports: number,
    executionsThisMonth: number,
    executionsThisWeek: number,
    successRate: number,
    averageExecutionTime: number,
    organizationId?: string
  ) {
    this.totalScheduledReports = totalScheduledReports;
    this.activeScheduledReports = activeScheduledReports;
    this.pausedScheduledReports = pausedScheduledReports;
    this.executionsThisMonth = executionsThisMonth;
    this.executionsThisWeek = executionsThisWeek;
    this.successRate = successRate;
    this.averageExecutionTime = averageExecutionTime;
    this.organizationId = organizationId;
  }

  public toPlainObject(): Record<string, any> {
    return {
      totalScheduledReports: this.totalScheduledReports,
      activeScheduledReports: this.activeScheduledReports,
      pausedScheduledReports: this.pausedScheduledReports,
      executionsThisMonth: this.executionsThisMonth,
      executionsThisWeek: this.executionsThisWeek,
      successRate: this.successRate,
      averageExecutionTime: this.averageExecutionTime,
      organizationId: this.organizationId,
    };
  }
}