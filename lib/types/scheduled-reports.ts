/**
 * Scheduled Reports Types and Interfaces
 * 
 * This file contains all TypeScript interfaces and types for the scheduled reports system
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface ScheduledReportConfig {
  id: string;
  name: string;
  description?: string;
  reportId: string;
  userId: string;
  organizationId?: string;
  schedule: string; // Cron expression
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'xlsx' | 'csv';
  options: ScheduledReportOptions;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReportOptions {
  includeCharts?: boolean;
  includeData?: boolean;
  includeMetadata?: boolean;
  customMessage?: string;
  filters?: Record<string, any>;
  dateRange?: {
    type: 'last_7_days' | 'last_30_days' | 'last_quarter' | 'custom';
    startDate?: string;
    endDate?: string;
  };
}

export interface ScheduledReportRun {
  id: string;
  scheduledReportId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // in seconds
  totalRecipients: number;
  successfulSends: number;
  failedSends: number;
  exportJobId?: string;
  downloadUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  errorDetails?: string;
  createdAt: Date;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateScheduledReportRequest {
  name: string;
  description?: string;
  reportId: string;
  organizationId?: string;
  schedule: string;
  timezone?: string;
  recipients: string[];
  format: 'pdf' | 'xlsx' | 'csv';
  options?: Partial<ScheduledReportOptions>;
  isActive?: boolean;
}

export interface UpdateScheduledReportRequest {
  name?: string;
  description?: string;
  schedule?: string;
  timezone?: string;
  recipients?: string[];
  format?: 'pdf' | 'xlsx' | 'csv';
  options?: Partial<ScheduledReportOptions>;
  isActive?: boolean;
}

export interface ScheduledReportFilters {
  isActive?: boolean;
  reportId?: string;
  userId?: string;
  organizationId?: string;
  format?: 'pdf' | 'xlsx' | 'csv';
  page?: number;
  limit?: number;
  search?: string;
}

export interface ScheduledReportRunFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginatedScheduledReports {
  scheduledReports: ScheduledReportConfig[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedScheduledReportRuns {
  runs: ScheduledReportRun[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// QUEUE JOB TYPES
// ============================================================================

export interface ScheduledReportJobPayload {
  scheduledReportId: string;
  reportId: string;
  userId: string;
  organizationId?: string;
  format: 'pdf' | 'xlsx' | 'csv';
  recipients: string[];
  options: ScheduledReportOptions;
  runId?: string;
}

export interface ScheduledReportExecutionResult {
  success: boolean;
  runId: string;
  exportJobId?: string;
  downloadUrl?: string;
  fileSize?: number;
  recipientsSent: number;
  totalRecipients: number;
  error?: string;
  duration: number;
}

// ============================================================================
// CRON SCHEDULE TYPES
// ============================================================================

export interface CronScheduleInfo {
  expression: string;
  description: string;
  nextRun: Date;
  isValid: boolean;
  timezone: string;
}

export interface ScheduleFrequency {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  time?: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone?: string;
  customCron?: string; // For custom schedules
}

// ============================================================================
// EMAIL TEMPLATE TYPES
// ============================================================================

export interface ScheduledReportEmailData {
  organizationName: string;
  reportName: string;
  reportType: string;
  reportPeriod: {
    start: string;
    end: string;
  };
  summary?: {
    totalRecords: number;
    generatedAt: string;
    fileSize: string;
  };
  downloadUrl?: string;
  customMessage?: string;
  dashboardUrl: string;
  appName: string;
  appUrl: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ScheduledReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ScheduledReportError';
  }
}

export class CronValidationError extends ScheduledReportError {
  constructor(expression: string, details?: string) {
    super(
      `Invalid cron expression: ${expression}`,
      'INVALID_CRON_EXPRESSION',
      { expression, details }
    );
  }
}

export class ReportAccessError extends ScheduledReportError {
  constructor(reportId: string, userId: string) {
    super(
      'Report not found or access denied',
      'REPORT_ACCESS_DENIED',
      { reportId, userId }
    );
  }
}

export class ScheduledReportNotFoundError extends ScheduledReportError {
  constructor(scheduledReportId: string) {
    super(
      'Scheduled report not found',
      'SCHEDULED_REPORT_NOT_FOUND',
      { scheduledReportId }
    );
  }
}

export class ScheduledReportValidationError extends ScheduledReportError {
  constructor(field: string, value: any, message: string) {
    super(
      `Validation error for field '${field}': ${message}`,
      'VALIDATION_ERROR',
      { field, value, message }
    );
  }
}

export class RecipientValidationError extends ScheduledReportError {
  constructor(invalidEmails: string[]) {
    super(
      `Invalid email addresses: ${invalidEmails.join(', ')}`,
      'INVALID_RECIPIENTS',
      { invalidEmails }
    );
  }
}

export class ScheduleConflictError extends ScheduledReportError {
  constructor(scheduledReportId: string, conflictingSchedule: string) {
    super(
      'Schedule conflicts with existing report',
      'SCHEDULE_CONFLICT',
      { scheduledReportId, conflictingSchedule }
    );
  }
}

export class ReportExecutionError extends ScheduledReportError {
  constructor(scheduledReportId: string, runId: string, originalError: Error) {
    super(
      `Failed to execute scheduled report: ${originalError.message}`,
      'EXECUTION_ERROR',
      { scheduledReportId, runId, originalError: originalError.message }
    );
  }
}

export class EmailDeliveryError extends ScheduledReportError {
  constructor(recipients: string[], failedRecipients: string[], originalError?: Error) {
    super(
      `Failed to deliver email to ${failedRecipients.length} of ${recipients.length} recipients`,
      'EMAIL_DELIVERY_ERROR',
      { recipients, failedRecipients, originalError: originalError?.message }
    );
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ScheduledReportStatus = 'active' | 'inactive' | 'error';
export type ScheduledReportRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScheduledReportStats {
  total: number;
  active: number;
  inactive: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunDate?: Date;
  nextRunDate?: Date;
}

export interface ScheduledReportWithRelations extends ScheduledReportConfig {
  report?: {
    id: string;
    name: string;
    description?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  runs?: ScheduledReportRun[];
  _count?: {
    runs: number;
  };
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// All types and interfaces are already exported above