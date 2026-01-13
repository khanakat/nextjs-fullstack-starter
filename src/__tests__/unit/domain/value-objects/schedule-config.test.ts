import { 
  ScheduleConfig, 
  DeliveryConfig, 
  ScheduleFrequency, 
  DeliveryMethod,
  ScheduledReport 
} from '../../../../shared/domain/reporting/entities/scheduled-report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

describe('ScheduleConfig and DeliveryConfig Value Objects', () => {
  describe('ScheduleConfig', () => {
    describe('Valid configurations', () => {
      it('should create valid daily schedule config', () => {
        const config: ScheduleConfig = {
          frequency: ScheduleFrequency.DAILY,
          hour: 9,
          minute: 30,
          timezone: 'America/New_York'
        };

        expect(() => createScheduledReportWithConfig(config)).not.toThrow();
      });

      it('should create valid weekly schedule config', () => {
        const config: ScheduleConfig = {
          frequency: ScheduleFrequency.WEEKLY,
          dayOfWeek: 1, // Monday
          hour: 8,
          minute: 0,
          timezone: 'UTC'
        };

        expect(() => createScheduledReportWithConfig(config)).not.toThrow();
      });

      it('should create valid monthly schedule config', () => {
        const config: ScheduleConfig = {
          frequency: ScheduleFrequency.MONTHLY,
          dayOfMonth: 15,
          hour: 12,
          minute: 0,
          timezone: 'Europe/London'
        };

        expect(() => createScheduledReportWithConfig(config)).not.toThrow();
      });

      it('should create valid quarterly schedule config', () => {
        const config: ScheduleConfig = {
          frequency: ScheduleFrequency.QUARTERLY,
          hour: 6,
          minute: 0,
          timezone: 'Asia/Tokyo'
        };

        expect(() => createScheduledReportWithConfig(config)).not.toThrow();
      });

      it('should create valid yearly schedule config', () => {
        const config: ScheduleConfig = {
          frequency: ScheduleFrequency.YEARLY,
          hour: 0,
          minute: 0,
          timezone: 'Australia/Sydney'
        };

        expect(() => createScheduledReportWithConfig(config)).not.toThrow();
      });
    });

    describe('Invalid configurations', () => {
      it('should reject invalid frequency', () => {
        const config = {
          frequency: 'INVALID' as ScheduleFrequency,
          hour: 9,
          minute: 30,
          timezone: 'UTC'
        };

        expect(() => createScheduledReportWithConfig(config))
          .toThrow(ValidationError);
        expect(() => createScheduledReportWithConfig(config))
          .toThrow('Invalid schedule frequency: INVALID');
      });

      it('should reject invalid hour values', () => {
        const configs = [
          { hour: -1 },
          { hour: 24 },
          { hour: 25 }
        ];

        configs.forEach(({ hour }) => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.DAILY,
            hour,
            minute: 0,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithConfig(config))
            .toThrow('Hour must be between 0 and 23');
        });
      });

      it('should reject invalid minute values', () => {
        const configs = [
          { minute: -1 },
          { minute: 60 },
          { minute: 61 }
        ];

        configs.forEach(({ minute }) => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.DAILY,
            hour: 12,
            minute,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithConfig(config))
            .toThrow('Minute must be between 0 and 59');
        });
      });

      it('should reject weekly frequency without dayOfWeek', () => {
        const config: ScheduleConfig = {
          frequency: ScheduleFrequency.WEEKLY,
          hour: 9,
          minute: 0,
          timezone: 'UTC'
        };

        expect(() => createScheduledReportWithConfig(config))
          .toThrow(ValidationError);
        expect(() => createScheduledReportWithConfig(config))
          .toThrow('Day of week must be between 0 and 6 for weekly frequency');
      });

      it('should reject weekly frequency with invalid dayOfWeek', () => {
        const invalidDays = [-1, 7, 8];

        invalidDays.forEach(dayOfWeek => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.WEEKLY,
            dayOfWeek,
            hour: 9,
            minute: 0,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithConfig(config))
            .toThrow('Day of week must be between 0 and 6 for weekly frequency');
        });
      });

      it('should reject monthly frequency without dayOfMonth', () => {
        const config: ScheduleConfig = {
          frequency: ScheduleFrequency.MONTHLY,
          hour: 9,
          minute: 0,
          timezone: 'UTC'
        };

        expect(() => createScheduledReportWithConfig(config))
          .toThrow(ValidationError);
        expect(() => createScheduledReportWithConfig(config))
          .toThrow('Day of month must be between 1 and 31 for monthly frequency');
      });

      it('should reject monthly frequency with invalid dayOfMonth', () => {
        const invalidDays = [0, 32, 35];

        invalidDays.forEach(dayOfMonth => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.MONTHLY,
            dayOfMonth,
            hour: 9,
            minute: 0,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithConfig(config))
            .toThrow('Day of month must be between 1 and 31 for monthly frequency');
        });
      });

      it('should reject empty timezone', () => {
        const configs = [
          { timezone: '' },
          { timezone: '   ' }
        ];

        configs.forEach(({ timezone }) => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.DAILY,
            hour: 9,
            minute: 0,
            timezone
          };

          expect(() => createScheduledReportWithConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithConfig(config))
            .toThrow('Timezone is required');
        });
      });
    });

    describe('Boundary values', () => {
      it('should accept boundary hour values', () => {
        const configs = [
          { hour: 0 },
          { hour: 23 }
        ];

        configs.forEach(({ hour }) => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.DAILY,
            hour,
            minute: 0,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config)).not.toThrow();
        });
      });

      it('should accept boundary minute values', () => {
        const configs = [
          { minute: 0 },
          { minute: 59 }
        ];

        configs.forEach(({ minute }) => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.DAILY,
            hour: 12,
            minute,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config)).not.toThrow();
        });
      });

      it('should accept boundary dayOfWeek values', () => {
        const configs = [
          { dayOfWeek: 0 }, // Sunday
          { dayOfWeek: 6 }  // Saturday
        ];

        configs.forEach(({ dayOfWeek }) => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.WEEKLY,
            dayOfWeek,
            hour: 9,
            minute: 0,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config)).not.toThrow();
        });
      });

      it('should accept boundary dayOfMonth values', () => {
        const configs = [
          { dayOfMonth: 1 },
          { dayOfMonth: 31 }
        ];

        configs.forEach(({ dayOfMonth }) => {
          const config: ScheduleConfig = {
            frequency: ScheduleFrequency.MONTHLY,
            dayOfMonth,
            hour: 9,
            minute: 0,
            timezone: 'UTC'
          };

          expect(() => createScheduledReportWithConfig(config)).not.toThrow();
        });
      });
    });
  });

  describe('DeliveryConfig', () => {
    describe('Valid configurations', () => {
      it('should create valid email delivery config', () => {
        const config: DeliveryConfig = {
          method: DeliveryMethod.EMAIL,
          recipients: ['user@example.com', 'admin@company.com'],
          format: 'PDF',
          includeCharts: true
        };

        expect(() => createScheduledReportWithDeliveryConfig(config)).not.toThrow();
      });

      it('should create valid webhook delivery config', () => {
        const config: DeliveryConfig = {
          method: DeliveryMethod.WEBHOOK,
          webhookUrl: 'https://api.example.com/webhook',
          format: 'EXCEL',
          includeCharts: false
        };

        expect(() => createScheduledReportWithDeliveryConfig(config)).not.toThrow();
      });

      it('should create valid download delivery config', () => {
        const config: DeliveryConfig = {
          method: DeliveryMethod.DOWNLOAD,
          format: 'CSV',
          includeCharts: true
        };

        expect(() => createScheduledReportWithDeliveryConfig(config)).not.toThrow();
      });

      it('should accept all valid formats', () => {
        const formats: Array<'PDF' | 'EXCEL' | 'CSV'> = ['PDF', 'EXCEL', 'CSV'];

        formats.forEach(format => {
          const config: DeliveryConfig = {
            method: DeliveryMethod.DOWNLOAD,
            format,
            includeCharts: true
          };

          expect(() => createScheduledReportWithDeliveryConfig(config)).not.toThrow();
        });
      });
    });

    describe('Invalid configurations', () => {
      it('should reject invalid delivery method', () => {
        const config = {
          method: 'INVALID' as DeliveryMethod,
          format: 'PDF' as const,
          includeCharts: true
        };

        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow(ValidationError);
        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow('Invalid delivery method: INVALID');
      });

      it('should reject email delivery without recipients', () => {
        const configs = [
          {
            method: DeliveryMethod.EMAIL,
            format: 'PDF' as const,
            includeCharts: true
          },
          {
            method: DeliveryMethod.EMAIL,
            recipients: [],
            format: 'PDF' as const,
            includeCharts: true
          }
        ];

        configs.forEach(config => {
          expect(() => createScheduledReportWithDeliveryConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithDeliveryConfig(config))
            .toThrow('Recipients are required for email delivery');
        });
      });

      it('should reject email delivery with invalid email addresses', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user@.com',
          'user space@example.com',
          ''
        ];

        invalidEmails.forEach((email, index) => {
          const config: DeliveryConfig = {
            method: DeliveryMethod.EMAIL,
            recipients: [email],
            format: 'PDF',
            includeCharts: true
          };

          expect(() => createScheduledReportWithDeliveryConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithDeliveryConfig(config))
            .toThrow(`Invalid email at index 0: ${email}`);
        });
      });

      it('should reject webhook delivery without webhookUrl', () => {
        const config: DeliveryConfig = {
          method: DeliveryMethod.WEBHOOK,
          format: 'PDF',
          includeCharts: true
        };

        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow(ValidationError);
        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow('Valid webhook URL is required for webhook delivery');
      });

      it('should reject webhook delivery with invalid URL', () => {
        const invalidUrls = [
          'not-a-url',
          'ftp://example.com',
          'http://',
          'https://',
          ''
        ];

        invalidUrls.forEach(webhookUrl => {
          const config: DeliveryConfig = {
            method: DeliveryMethod.WEBHOOK,
            webhookUrl,
            format: 'PDF',
            includeCharts: true
          };

          expect(() => createScheduledReportWithDeliveryConfig(config))
            .toThrow(ValidationError);
          expect(() => createScheduledReportWithDeliveryConfig(config))
            .toThrow('Valid webhook URL is required for webhook delivery');
        });
      });

      it('should reject invalid format', () => {
        const config = {
          method: DeliveryMethod.DOWNLOAD,
          format: 'INVALID' as any,
          includeCharts: true
        };

        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow(ValidationError);
        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow('Invalid format: INVALID');
      });
    });

    describe('Email validation', () => {
      it('should accept valid email addresses', () => {
        const validEmails = [
          'user@example.com',
          'admin@company.co.uk',
          'test.email+tag@domain.org',
          'user123@test-domain.com',
          'a@b.co'
        ];

        validEmails.forEach(email => {
          const config: DeliveryConfig = {
            method: DeliveryMethod.EMAIL,
            recipients: [email],
            format: 'PDF',
            includeCharts: true
          };

          expect(() => createScheduledReportWithDeliveryConfig(config)).not.toThrow();
        });
      });

      it('should handle multiple recipients with mixed validity', () => {
        const config: DeliveryConfig = {
          method: DeliveryMethod.EMAIL,
          recipients: ['valid@example.com', 'invalid-email'],
          format: 'PDF',
          includeCharts: true
        };

        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow(ValidationError);
        expect(() => createScheduledReportWithDeliveryConfig(config))
          .toThrow('Invalid email at index 1: invalid-email');
      });
    });

    describe('URL validation', () => {
      it('should accept valid webhook URLs', () => {
        const validUrls = [
          'https://api.example.com/webhook',
          'http://localhost:3000/webhook',
          'https://subdomain.domain.com/path/to/webhook',
          'https://example.com:8080/webhook'
        ];

        validUrls.forEach(webhookUrl => {
          const config: DeliveryConfig = {
            method: DeliveryMethod.WEBHOOK,
            webhookUrl,
            format: 'PDF',
            includeCharts: true
          };

          expect(() => createScheduledReportWithDeliveryConfig(config)).not.toThrow();
        });
      });
    });
  });

  describe('Integration with ScheduledReport', () => {
    it('should create scheduled report with valid configs', () => {
      const scheduleConfig: ScheduleConfig = {
        frequency: ScheduleFrequency.WEEKLY,
        dayOfWeek: 1,
        hour: 9,
        minute: 30,
        timezone: 'America/New_York'
      };

      const deliveryConfig: DeliveryConfig = {
        method: DeliveryMethod.EMAIL,
        recipients: ['user@example.com'],
        format: 'PDF',
        includeCharts: true
      };

      expect(() => {
        ScheduledReport.create({
          name: 'Weekly Sales Report',
          description: 'Weekly sales summary',
          reportId: UniqueId.generate(),
          scheduleConfig,
          deliveryConfig,
          status: 'ACTIVE' as any,
          createdBy: UniqueId.generate()
        });
      }).not.toThrow();
    });

    it('should reject scheduled report with invalid configs', () => {
      const invalidScheduleConfig: ScheduleConfig = {
        frequency: ScheduleFrequency.WEEKLY,
        hour: 25, // Invalid hour
        minute: 0,
        timezone: 'UTC'
      };

      const validDeliveryConfig: DeliveryConfig = {
        method: DeliveryMethod.EMAIL,
        recipients: ['user@example.com'],
        format: 'PDF',
        includeCharts: true
      };

      expect(() => {
        ScheduledReport.create({
          name: 'Test Report',
          reportId: UniqueId.generate(),
          scheduleConfig: invalidScheduleConfig,
          deliveryConfig: validDeliveryConfig,
          status: 'ACTIVE' as any,
          createdBy: UniqueId.generate()
        });
      }).toThrow(ValidationError);
    });
  });
});

// Helper functions
function createScheduledReportWithConfig(scheduleConfig: ScheduleConfig): ScheduledReport {
  const validDeliveryConfig: DeliveryConfig = {
    method: DeliveryMethod.EMAIL,
    recipients: ['test@example.com'],
    format: 'PDF',
    includeCharts: true
  };

  return ScheduledReport.create({
    name: 'Test Report',
    reportId: UniqueId.generate(),
    scheduleConfig,
    deliveryConfig: validDeliveryConfig,
    status: 'ACTIVE' as any,
    createdBy: UniqueId.generate()
  });
}

function createScheduledReportWithDeliveryConfig(deliveryConfig: DeliveryConfig): ScheduledReport {
  const validScheduleConfig: ScheduleConfig = {
    frequency: ScheduleFrequency.DAILY,
    hour: 9,
    minute: 0,
    timezone: 'UTC'
  };

  return ScheduledReport.create({
    name: 'Test Report',
    reportId: UniqueId.generate(),
    scheduleConfig: validScheduleConfig,
    deliveryConfig,
    status: 'ACTIVE' as any,
    createdBy: UniqueId.generate()
  });
}