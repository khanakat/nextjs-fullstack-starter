import { CreateReportCommand } from '../../../../../slices/reporting/application/commands/create-report-command';
import { ReportConfigDto } from '../../../../../slices/reporting/application/dtos/report-dto';

describe('CreateReportCommand', () => {
  const validConfig: ReportConfigDto = {
    title: 'Test Config',
    description: 'Test Description',
    templateId: 'template-123',
    filters: {
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
      categories: ['sales', 'marketing'],
    },
    parameters: {
      includeCharts: true,
      format: 'pdf',
    },
  };

  const validUserId = 'user-123';
  const validTitle = 'Test Report';
  const validDescription = 'Test report description';
  const validTemplateId = 'template-123';
  const validOrganizationId = 'org-123';

  describe('constructor', () => {
    it('should create command with all parameters', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        validDescription,
        validTemplateId,
        validOrganizationId
      );

      expect(command.title).toBe(validTitle);
      expect(command.description).toBe(validDescription);
      expect(command.config).toEqual(validConfig);
      expect(command.isPublic).toBe(true);
      expect(command.templateId).toBe(validTemplateId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.userId).toBe(validUserId);
    });

    it('should create command with required parameters only', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        false,
        validUserId
      );

      expect(command.title).toBe(validTitle);
      expect(command.description).toBeUndefined();
      expect(command.config).toEqual(validConfig);
      expect(command.isPublic).toBe(false);
      expect(command.templateId).toBeUndefined();
      expect(command.organizationId).toBeUndefined();
      expect(command.userId).toBe(validUserId);
    });
  });

  describe('validate', () => {
    it('should validate successfully with valid data', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        validDescription,
        validTemplateId,
        validOrganizationId
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should validate successfully with minimal valid data', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        false,
        validUserId
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should throw error for empty title', () => {
      const command = new CreateReportCommand(
        '',
        validConfig,
        true,
        validUserId
      );

      expect(() => command.validate()).toThrow('Report title is required');
    });

    it('should throw error for whitespace-only title', () => {
      const command = new CreateReportCommand(
        '   ',
        validConfig,
        true,
        validUserId
      );

      expect(() => command.validate()).toThrow('Report title is required');
    });

    it('should throw error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const command = new CreateReportCommand(
        longTitle,
        validConfig,
        true,
        validUserId
      );

      expect(() => command.validate()).toThrow('Report title cannot exceed 200 characters');
    });

    it('should allow title with exactly 200 characters', () => {
      const maxTitle = 'a'.repeat(200);
      const command = new CreateReportCommand(
        maxTitle,
        validConfig,
        true,
        validUserId
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should throw error for description exceeding 1000 characters', () => {
      const longDescription = 'a'.repeat(1001);
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        longDescription
      );

      expect(() => command.validate()).toThrow('Report description cannot exceed 1000 characters');
    });

    it('should allow description with exactly 1000 characters', () => {
      const maxDescription = 'a'.repeat(1000);
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        maxDescription
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should allow undefined description', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        undefined
      );

      expect(() => command.validate()).not.toThrow();
    });

    it('should throw error for missing config', () => {
      const command = new CreateReportCommand(
        validTitle,
        null as any,
        true,
        validUserId
      );

      expect(() => command.validate()).toThrow('Report configuration is required');
    });

    it('should throw error for undefined config', () => {
      const command = new CreateReportCommand(
        validTitle,
        undefined as any,
        true,
        validUserId
      );

      expect(() => command.validate()).toThrow('Report configuration is required');
    });

    it('should throw error for empty userId', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        ''
      );

      expect(() => command.validate()).toThrow('User ID is required');
    });

    it('should throw error for null userId', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        null as any
      );

      expect(() => command.validate()).toThrow('User ID is required');
    });

    it('should throw error for undefined userId', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        undefined as any
      );

      expect(() => command.validate()).toThrow('User ID is required');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in title', () => {
      const specialTitle = 'Report with @#$%^&*()_+ characters';
      const command = new CreateReportCommand(
        specialTitle,
        validConfig,
        true,
        validUserId
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.title).toBe(specialTitle);
    });

    it('should handle unicode characters in title', () => {
      const unicodeTitle = 'Report with émojis 🚀 and ñ characters';
      const command = new CreateReportCommand(
        unicodeTitle,
        validConfig,
        true,
        validUserId
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.title).toBe(unicodeTitle);
    });

    it('should handle empty description string', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        ''
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.description).toBe('');
    });

    it('should handle complex config object', () => {
      const complexConfig: ReportConfigDto = {
        title: 'Complex Config',
        description: 'Complex configuration with nested objects',
        templateId: 'template-456',
        filters: {
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          },
          categories: ['sales', 'marketing', 'finance'],
          regions: ['north', 'south', 'east', 'west'],
          status: ['active', 'inactive'],
          customFilters: {
            revenue: { min: 1000, max: 100000 },
            employees: { min: 10, max: 500 },
          },
        },
        parameters: {
          includeCharts: true,
          includeGraphs: true,
          format: 'pdf',
          orientation: 'landscape',
          fontSize: 12,
          colorScheme: 'blue',
          customSettings: {
            showLogo: true,
            showFooter: false,
            watermark: 'CONFIDENTIAL',
          },
        },
      };

      const command = new CreateReportCommand(
        validTitle,
        complexConfig,
        true,
        validUserId
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.config).toEqual(complexConfig);
    });

    it('should handle boolean isPublic values correctly', () => {
      const publicCommand = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId
      );

      const privateCommand = new CreateReportCommand(
        validTitle,
        validConfig,
        false,
        validUserId
      );

      expect(publicCommand.isPublic).toBe(true);
      expect(privateCommand.isPublic).toBe(false);
    });

    it('should handle optional parameters as undefined', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        undefined,
        undefined,
        undefined
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.description).toBeUndefined();
      expect(command.templateId).toBeUndefined();
      expect(command.organizationId).toBeUndefined();
    });

    it('should handle empty string optional parameters', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId,
        '',
        '',
        ''
      );

      expect(() => command.validate()).not.toThrow();
      expect(command.description).toBe('');
      expect(command.templateId).toBe('');
      expect(command.organizationId).toBe('');
    });
  });

  describe('inheritance from Command base class', () => {
    it('should inherit userId from base Command class', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId
      );

      expect(command.userId).toBe(validUserId);
    });

    it('should call parent validate method', () => {
      const command = new CreateReportCommand(
        validTitle,
        validConfig,
        true,
        validUserId
      );

      // This should not throw as it calls super.validate() which validates userId
      expect(() => command.validate()).not.toThrow();
    });
  });
});