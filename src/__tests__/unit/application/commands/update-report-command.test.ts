import { UpdateReportCommand } from '../../../../../slices/reporting/application/commands/update-report-command';
import { ReportConfigDto } from '../../../../../slices/reporting/application/dtos/report-dto';

describe('UpdateReportCommand', () => {
  const validReportId = 'report-123';
  const validUserId = 'user-123';
  const validTitle = 'Updated Report Title';
  const validDescription = 'Updated report description';
  const validConfig: ReportConfigDto = {
    title: 'Updated Config',
    description: 'Updated Configuration',
    templateId: 'template-456',
    filters: {
      dateRange: {
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      },
      categories: ['finance', 'operations'],
    },
    parameters: {
      includeCharts: false,
      format: 'excel',
    },
  };

  describe('constructor', () => {
    it('should create command with all parameters', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        validTitle,
        validDescription,
        validConfig,
        true
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.userId).toBe(validUserId);
      expect(command.title).toBe(validTitle);
      expect(command.description).toBe(validDescription);
      expect(command.config).toEqual(validConfig);
      expect(command.isPublic).toBe(true);
    });

    it('should create command with required parameters only', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.userId).toBe(validUserId);
      expect(command.title).toBeUndefined();
      expect(command.description).toBeUndefined();
      expect(command.config).toBeUndefined();
      expect(command.isPublic).toBeUndefined();
    });

    it('should create command with partial updates', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        validTitle,
        undefined,
        undefined,
        false
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.userId).toBe(validUserId);
      expect(command.title).toBe(validTitle);
      expect(command.description).toBeUndefined();
      expect(command.config).toBeUndefined();
      expect(command.isPublic).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate successfully with all fields', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        validTitle,
        validDescription,
        validConfig,
        true
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should validate successfully with only title update', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        validTitle
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should validate successfully with only description update', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        validDescription
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should validate successfully with only config update', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        validConfig
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should validate successfully with only isPublic update', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        undefined,
        false
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should throw error for empty reportId', () => {
      const command = new UpdateReportCommand(
        '',
        validUserId,
        validTitle
      );

      expect(() => command.validate()).toThrow('Report ID is required');
    });

    it('should throw error for whitespace-only reportId', () => {
      const command = new UpdateReportCommand(
        '   ',
        validUserId,
        validTitle
      );

      expect(() => command.validate()).toThrow('Report ID is required');
    });

    it('should throw error for null reportId', () => {
      const command = new UpdateReportCommand(
        null as any,
        validUserId,
        validTitle
      );

      expect(() => command.validate()).toThrow('Report ID is required');
    });

    it('should throw error for empty userId', () => {
      const command = new UpdateReportCommand(
        validReportId,
        '',
        validTitle
      );

      expect(() => command.validate()).toThrow('User ID is required');
    });

    it('should throw error for null userId', () => {
      const command = new UpdateReportCommand(
        validReportId,
        null as any,
        validTitle
      );

      expect(() => command.validate()).toThrow('User ID is required');
    });

    it('should throw error for empty title when title is provided', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        ''
      );

      expect(() => command.validate()).toThrow('Report title cannot be empty');
    });

    it('should throw error for whitespace-only title when title is provided', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        '   '
      );

      expect(() => command.validate()).toThrow('Report title cannot be empty');
    });

    it('should throw error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        longTitle
      );

      expect(() => command.validate()).toThrow('Report title cannot exceed 200 characters');
    });

    it('should allow title with exactly 200 characters', () => {
      const maxTitle = 'a'.repeat(200);
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        maxTitle
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should throw error for description exceeding 1000 characters', () => {
      const longDescription = 'a'.repeat(1001);
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        longDescription
      );

      expect(() => command.validate()).toThrow('Report description cannot exceed 1000 characters');
    });

    it('should allow description with exactly 1000 characters', () => {
      const maxDescription = 'a'.repeat(1000);
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        maxDescription
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should allow empty description string', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        ''
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should throw error when no fields are provided for update', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId
      );

      expect(() => command.validate()).toThrow('At least one field must be provided for update');
    });

    it('should throw error when all fields are explicitly undefined', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(() => command.validate()).toThrow('At least one field must be provided for update');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in title', () => {
      const specialTitle = 'Updated Report with @#$%^&*()_+ characters';
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        specialTitle
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.title).toBe(specialTitle);
    });

    it('should handle unicode characters in title', () => {
      const unicodeTitle = 'Updated Report with émojis 🚀 and ñ characters';
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        unicodeTitle
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.title).toBe(unicodeTitle);
    });

    it('should handle complex config object update', () => {
      const complexConfig: ReportConfigDto = {
        title: 'Complex Updated Config',
        description: 'Complex updated configuration with nested objects',
        templateId: 'template-789',
        filters: {
          dateRange: {
            startDate: '2024-03-01',
            endDate: '2024-03-31',
          },
          categories: ['hr', 'legal', 'compliance'],
          regions: ['central', 'international'],
          status: ['pending', 'approved'],
          customFilters: {
            budget: { min: 5000, max: 500000 },
            duration: { min: 30, max: 365 },
          },
        },
        parameters: {
          includeCharts: false,
          includeGraphs: true,
          format: 'powerpoint',
          orientation: 'portrait',
          fontSize: 14,
          colorScheme: 'green',
          customSettings: {
            showLogo: false,
            showFooter: true,
            watermark: 'DRAFT',
          },
        },
      };

      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        complexConfig
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.config).toEqual(complexConfig);
    });

    it('should handle boolean isPublic values correctly', () => {
      const publicCommand = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        undefined,
        true
      );

      const privateCommand = new UpdateReportCommand(
        validReportId,
        validUserId,
        undefined,
        undefined,
        undefined,
        false
      );

      expect(publicCommand.isPublic).toBe(true);
      expect(privateCommand.isPublic).toBe(false);
    });

    it('should handle multiple field updates simultaneously', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'New Title',
        'New Description',
        validConfig,
        true
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.title).toBe('New Title');
      expect(command.description).toBe('New Description');
      expect(command.config).toEqual(validConfig);
      expect(command.isPublic).toBe(true);
    });

    it('should handle partial field updates', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        'Only Title Update',
        undefined,
        undefined,
        undefined
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.title).toBe('Only Title Update');
      expect(command.description).toBeUndefined();
      expect(command.config).toBeUndefined();
      expect(command.isPublic).toBeUndefined();
    });

    it('should handle reportId with special characters', () => {
      const specialReportId = 'report-123-abc_def@domain.com';
      const command = new UpdateReportCommand(
        specialReportId,
        validUserId,
        validTitle
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.reportId).toBe(specialReportId);
    });

    it('should handle userId with special characters', () => {
      const specialUserId = 'user-456-xyz_abc@domain.com';
      const command = new UpdateReportCommand(
        validReportId,
        specialUserId,
        validTitle
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.userId).toBe(specialUserId);
    });
  });

  describe('inheritance from Command base class', () => {
    it('should inherit userId from base Command class', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        validTitle
      );

      expect(command.userId).toBe(validUserId);
    });

    it('should call parent validate method', () => {
      const command = new UpdateReportCommand(
        validReportId,
        validUserId,
        validTitle
      );

      // This should not throw as it calls super.validate() which validates userId
      expect(() => command.validate()).not.toThrow();
    });
  });
});