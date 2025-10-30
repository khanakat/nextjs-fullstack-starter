/**
 * Tests for Scheduled Reports Validation Utilities
 */

import {
  isValidEmail,
  validateRecipients,
  validateCronExpression,
  validateTimezone,
  validateReportName,
  validateReportDescription,
  validateReportFormat,
  validateReportOptions,
  validateCreateScheduledReportRequest,
  validateUpdateScheduledReportRequest,
  validateScheduleConflict,
  validateExecutionLimits,
  validateReportAccess,
} from '@/lib/utils/scheduled-reports-validation';

import {
  ScheduledReportValidationError,
  RecipientValidationError,
  CronValidationError,
} from '@/lib/types/scheduled-reports';

describe('Scheduled Reports Validation', () => {
  describe('Email Validation', () => {
    test('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@test-domain.org')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test..test@domain.com')).toBe(false);
    });

    test('should validate recipients array', () => {
      const validRecipients = ['test1@example.com', 'test2@example.com'];
      expect(() => validateRecipients(validRecipients)).not.toThrow();
    });

    test('should reject empty recipients array', () => {
      expect(() => validateRecipients([])).toThrow(ScheduledReportValidationError);
    });

    test('should reject invalid email in recipients', () => {
      const invalidRecipients = ['test1@example.com', 'invalid-email'];
      expect(() => validateRecipients(invalidRecipients)).toThrow(RecipientValidationError);
    });

    test('should reject duplicate emails', () => {
      const duplicateRecipients = ['test@example.com', 'test@example.com'];
      expect(() => validateRecipients(duplicateRecipients)).toThrow(ScheduledReportValidationError);
    });

    test('should reject too many recipients', () => {
      const tooManyRecipients = Array.from({ length: 51 }, (_, i) => `test${i}@example.com`);
      expect(() => validateRecipients(tooManyRecipients)).toThrow(ScheduledReportValidationError);
    });
  });

  describe('Cron Expression Validation', () => {
    test('should validate correct cron expressions', () => {
      expect(() => validateCronExpression('0 9 * * 1')).not.toThrow(); // Every Monday at 9 AM
      expect(() => validateCronExpression('0 0 1 * *')).not.toThrow(); // First day of every month
      expect(() => validateCronExpression('30 14 * * 5')).not.toThrow(); // Every Friday at 2:30 PM
    });

    test('should reject invalid cron expressions', () => {
      expect(() => validateCronExpression('')).toThrow(CronValidationError);
      expect(() => validateCronExpression('invalid')).toThrow(CronValidationError);
      expect(() => validateCronExpression('0 25 * * *')).toThrow(CronValidationError); // Invalid hour
    });

    test('should reject too frequent executions', () => {
      expect(() => validateCronExpression('* * * * *')).toThrow(CronValidationError); // Every minute
    });
  });

  describe('Timezone Validation', () => {
    test('should validate correct timezones', () => {
      expect(() => validateTimezone('UTC')).not.toThrow();
      expect(() => validateTimezone('America/New_York')).not.toThrow();
      expect(() => validateTimezone('Europe/London')).not.toThrow();
    });

    test('should reject invalid timezones', () => {
      expect(() => validateTimezone('Invalid/Timezone')).toThrow(ScheduledReportValidationError);
    });

    test('should allow undefined timezone', () => {
      expect(() => validateTimezone(undefined as any)).not.toThrow();
    });
  });

  describe('Report Name Validation', () => {
    test('should validate correct report names', () => {
      expect(() => validateReportName('Valid Report Name')).not.toThrow();
      expect(() => validateReportName('Report-123')).not.toThrow();
    });

    test('should reject empty or invalid names', () => {
      expect(() => validateReportName('')).toThrow(ScheduledReportValidationError);
      expect(() => validateReportName('   ')).toThrow(ScheduledReportValidationError);
      expect(() => validateReportName('A'.repeat(101))).toThrow(ScheduledReportValidationError);
      expect(() => validateReportName('Report<>Name')).toThrow(ScheduledReportValidationError);
    });
  });

  describe('Report Format Validation', () => {
    test('should validate correct formats', () => {
      expect(() => validateReportFormat('pdf')).not.toThrow();
      expect(() => validateReportFormat('xlsx')).not.toThrow();
      expect(() => validateReportFormat('csv')).not.toThrow();
    });

    test('should reject invalid formats', () => {
      expect(() => validateReportFormat('doc')).toThrow(ScheduledReportValidationError);
      expect(() => validateReportFormat('txt')).toThrow(ScheduledReportValidationError);
    });
  });

  describe('Report Options Validation', () => {
    test('should validate correct options', () => {
      const validOptions = {
        includeCharts: true,
        includeData: true,
        customMessage: 'Test message',
        dateRange: {
          type: 'last_30_days' as const,
        },
      };
      expect(() => validateReportOptions(validOptions)).not.toThrow();
    });

    test('should reject custom message that is too long', () => {
      const invalidOptions = {
        customMessage: 'A'.repeat(1001),
      };
      expect(() => validateReportOptions(invalidOptions)).toThrow(ScheduledReportValidationError);
    });

    test('should validate custom date range', () => {
      const validCustomRange = {
        dateRange: {
          type: 'custom' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };
      expect(() => validateReportOptions(validCustomRange)).not.toThrow();
    });

    test('should reject invalid custom date range', () => {
      const invalidCustomRange = {
        dateRange: {
          type: 'custom' as const,
          startDate: '2024-01-31',
          endDate: '2024-01-01', // End before start
        },
      };
      expect(() => validateReportOptions(invalidCustomRange)).toThrow(ScheduledReportValidationError);
    });
  });

  describe('Create Request Validation', () => {
    const validCreateRequest = {
      name: 'Test Report',
      reportId: '123e4567-e89b-12d3-a456-426614174000',
      schedule: '0 9 * * 1',
      timezone: 'UTC',
      recipients: ['test@example.com'],
      format: 'pdf' as const,
      options: {},
    };

    test('should validate correct create request', () => {
      expect(() => validateCreateScheduledReportRequest(validCreateRequest)).not.toThrow();
    });

    test('should reject request with missing required fields', () => {
      const invalidRequest = { ...validCreateRequest };
      delete (invalidRequest as any).name;
      expect(() => validateCreateScheduledReportRequest(invalidRequest)).toThrow();
    });
  });

  describe('Update Request Validation', () => {
    test('should validate correct update request', () => {
      const validUpdateRequest = {
        name: 'Updated Report Name',
        recipients: ['updated@example.com'],
      };
      expect(() => validateUpdateScheduledReportRequest(validUpdateRequest)).not.toThrow();
    });

    test('should validate empty update request', () => {
      expect(() => validateUpdateScheduledReportRequest({})).not.toThrow();
    });
  });

  describe('Business Logic Validation', () => {
    test('should detect schedule conflicts', () => {
      const existingSchedules = [
        { id: '1', schedule: '0 9 * * 1', name: 'Existing Report' },
      ];
      
      expect(() => validateScheduleConflict('0 9 * * 1', existingSchedules)).toThrow(
        ScheduledReportValidationError
      );
    });

    test('should allow same schedule for different reports when excluding ID', () => {
      const existingSchedules = [
        { id: '1', schedule: '0 9 * * 1', name: 'Existing Report' },
      ];
      
      expect(() => validateScheduleConflict('0 9 * * 1', existingSchedules, '1')).not.toThrow();
    });

    test('should validate execution limits', () => {
      expect(() => validateExecutionLimits('org1', 50, 100)).not.toThrow();
      expect(() => validateExecutionLimits('org1', 100, 100)).toThrow(ScheduledReportValidationError);
    });

    test('should validate report access', () => {
      const userReports = ['report1', 'report2'];
      
      expect(() => validateReportAccess('report1', 'user1', userReports)).not.toThrow();
      expect(() => validateReportAccess('report3', 'user1', userReports)).toThrow(
        ScheduledReportValidationError
      );
    });
  });
});