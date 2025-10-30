/**
 * Scheduled Reports Validation Utilities
 * 
 * Comprehensive validation functions for scheduled reports system
 */

import * as cron from 'node-cron';
import { 
  ScheduledReportValidationError, 
  RecipientValidationError,
  CronValidationError,
  CreateScheduledReportRequest,
  UpdateScheduledReportRequest,
  ScheduledReportOptions
} from '@/lib/types/scheduled-reports';

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional checks for edge cases
  if (!emailRegex.test(email)) return false;
  if (email.includes('..')) return false; // No consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false; // No leading/trailing dots
  if (email.includes('@.') || email.includes('.@')) return false; // No dots adjacent to @
  
  return true;
}

/**
 * Validate array of email addresses
 */
export function validateRecipients(recipients: string[]): void {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new ScheduledReportValidationError('recipients', recipients, 'At least one recipient is required');
  }

  const invalidEmails = recipients.filter(email => !isValidEmail(email));
  
  if (invalidEmails.length > 0) {
    throw new RecipientValidationError(invalidEmails);
  }

  // Check for duplicates
  const uniqueEmails = new Set(recipients);
  if (uniqueEmails.size !== recipients.length) {
    throw new ScheduledReportValidationError('recipients', recipients, 'Duplicate email addresses found');
  }

  // Check maximum recipients limit
  if (recipients.length > 50) {
    throw new ScheduledReportValidationError('recipients', recipients, 'Maximum 50 recipients allowed');
  }
}

// ============================================================================
// CRON VALIDATION
// ============================================================================

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): void {
  if (!expression || typeof expression !== 'string') {
    throw new CronValidationError(expression, 'Cron expression is required');
  }

  if (!cron.validate(expression)) {
    throw new CronValidationError(expression, 'Invalid cron expression format');
  }

  // Additional validation for reasonable schedules
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    throw new CronValidationError(expression, 'Cron expression must have 5 or 6 parts');
  }

  // Prevent too frequent executions (minimum 1 minute)
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  if (minute === '*' && hour === '*') {
    throw new CronValidationError(expression, 'Execution every minute is not allowed');
  }
}

/**
 * Validate timezone
 */
export function validateTimezone(timezone: string): void {
  if (!timezone) return; // Optional field

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch (error) {
    throw new ScheduledReportValidationError('timezone', timezone, 'Invalid timezone');
  }
}

// ============================================================================
// REPORT VALIDATION
// ============================================================================

/**
 * Validate report name
 */
export function validateReportName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new ScheduledReportValidationError('name', name, 'Report name is required');
  }

  if (name.trim().length === 0) {
    throw new ScheduledReportValidationError('name', name, 'Report name cannot be empty');
  }

  if (name.length > 100) {
    throw new ScheduledReportValidationError('name', name, 'Report name cannot exceed 100 characters');
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    throw new ScheduledReportValidationError('name', name, 'Report name contains invalid characters');
  }
}

/**
 * Validate report description
 */
export function validateReportDescription(description?: string): void {
  if (description && description.length > 500) {
    throw new ScheduledReportValidationError('description', description, 'Description cannot exceed 500 characters');
  }
}

/**
 * Validate report format
 */
export function validateReportFormat(format: string): void {
  const validFormats = ['pdf', 'xlsx', 'csv'];
  
  if (!validFormats.includes(format)) {
    throw new ScheduledReportValidationError('format', format, `Format must be one of: ${validFormats.join(', ')}`);
  }
}

/**
 * Validate report options
 */
export function validateReportOptions(options: Partial<ScheduledReportOptions>): void {
  if (!options) return;

  // Validate custom message length
  if (options.customMessage && options.customMessage.length > 1000) {
    throw new ScheduledReportValidationError('options.customMessage', options.customMessage, 'Custom message cannot exceed 1000 characters');
  }

  // Validate date range
  if (options.dateRange) {
    const { type, startDate, endDate } = options.dateRange;
    
    if (type === 'custom') {
      if (!startDate || !endDate) {
        throw new ScheduledReportValidationError('options.dateRange', options.dateRange, 'Start date and end date are required for custom date range');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ScheduledReportValidationError('options.dateRange', options.dateRange, 'Invalid date format');
      }

      if (start >= end) {
        throw new ScheduledReportValidationError('options.dateRange', options.dateRange, 'Start date must be before end date');
      }

      // Prevent date ranges that are too large (more than 2 years)
      const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
      if (end.getTime() - start.getTime() > maxRange) {
        throw new ScheduledReportValidationError('options.dateRange', options.dateRange, 'Date range cannot exceed 2 years');
      }
    }
  }
}

// ============================================================================
// COMPREHENSIVE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate create scheduled report request
 */
export function validateCreateScheduledReportRequest(request: CreateScheduledReportRequest): void {
  // Validate required fields
  validateReportName(request.name);
  validateReportDescription(request.description);
  
  if (!request.reportId) {
    throw new ScheduledReportValidationError('reportId', request.reportId, 'Report ID is required');
  }

  validateCronExpression(request.schedule);
  validateTimezone(request.timezone || 'UTC');
  validateRecipients(request.recipients);
  validateReportFormat(request.format);
  validateReportOptions(request.options || {});

  // Validate organization ID if provided
  if (request.organizationId && typeof request.organizationId !== 'string') {
    throw new ScheduledReportValidationError('organizationId', request.organizationId, 'Invalid organization ID');
  }
}

/**
 * Validate update scheduled report request
 */
export function validateUpdateScheduledReportRequest(request: UpdateScheduledReportRequest): void {
  // Only validate fields that are being updated
  if (request.name !== undefined) {
    validateReportName(request.name);
  }

  if (request.description !== undefined) {
    validateReportDescription(request.description);
  }

  if (request.schedule !== undefined) {
    validateCronExpression(request.schedule);
  }

  if (request.timezone !== undefined) {
    validateTimezone(request.timezone);
  }

  if (request.recipients !== undefined) {
    validateRecipients(request.recipients);
  }

  if (request.format !== undefined) {
    validateReportFormat(request.format);
  }

  if (request.options !== undefined) {
    validateReportOptions(request.options);
  }
}

// ============================================================================
// BUSINESS LOGIC VALIDATION
// ============================================================================

/**
 * Validate that a scheduled report doesn't conflict with existing schedules
 */
export function validateScheduleConflict(
  newSchedule: string,
  existingSchedules: Array<{ id: string; schedule: string; name: string }>,
  excludeId?: string
): void {
  // This is a simplified check - in a real implementation, you might want to
  // check for overlapping execution times or resource conflicts
  
  const conflictingSchedules = existingSchedules.filter(existing => 
    existing.id !== excludeId && 
    existing.schedule === newSchedule
  );

  if (conflictingSchedules.length > 0) {
    const conflictNames = conflictingSchedules.map(s => s.name).join(', ');
    throw new ScheduledReportValidationError(
      'schedule', 
      newSchedule, 
      `Schedule conflicts with existing reports: ${conflictNames}`
    );
  }
}

/**
 * Validate execution limits per organization
 */
export function validateExecutionLimits(
  organizationId: string,
  currentActiveReports: number,
  maxReportsPerOrg: number = 100
): void {
  if (currentActiveReports >= maxReportsPerOrg) {
    throw new ScheduledReportValidationError(
      'organizationId',
      organizationId,
      `Maximum number of scheduled reports (${maxReportsPerOrg}) reached for this organization`
    );
  }
}

/**
 * Validate report access permissions
 */
export function validateReportAccess(
  reportId: string,
  userId: string,
  userReports: string[]
): void {
  if (!userReports.includes(reportId)) {
    throw new ScheduledReportValidationError(
      'reportId',
      reportId,
      'You do not have access to this report'
    );
  }
}