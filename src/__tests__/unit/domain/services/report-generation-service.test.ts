import { ReportGenerationService, ReportGenerationRequest, ReportFromTemplateRequest } from '../../../../shared/domain/reporting/services/report-generation-service';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { ReportTemplate } from '../../../../shared/domain/reporting/entities/report-template';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { BusinessRuleViolationError } from '../../../../shared/domain/exceptions/business-rule-violation-error';
import { ReportFactory } from '../../../factories/report-factory';
import { ReportTemplateFactory } from '../../../factories/report-template-factory';

describe('ReportGenerationService', () => {
  const mockUserId = UniqueId.create('user-123');
  const mockOrganizationId = UniqueId.create('org-456');
  const mockTemplateId = UniqueId.create('template-789');

  describe('generateReport', () => {
    it('should generate report with provided configuration', () => {
      // Arrange
      const config = ReportConfig.createDefault();
      const layout = ReportLayout.createDefault();
      const styling = ReportStyling.createDefault();

      const request: ReportGenerationRequest = {
        title: 'Test Report',
        description: 'Test Description',
        config,
        layout,
        styling,
        isPublic: true,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act
      const result = ReportGenerationService.generateReport(request);

      // Assert
      expect(result).toBeInstanceOf(Report);
      expect(result.title).toBe('Test Report');
      expect(result.description).toBe('Test Description');
      expect(result.config).toBe(config);
      expect(result.layout).toBe(layout);
      expect(result.styling).toBe(styling);
      expect(result.isPublic).toBe(true);
      expect(result.createdBy).toBe(mockUserId);
      expect(result.organizationId).toBe(mockOrganizationId);
    });

    it('should generate report with default configuration when not provided', () => {
      // Arrange
      const request: ReportGenerationRequest = {
        title: 'Test Report',
        createdBy: mockUserId,
      };

      // Act
      const result = ReportGenerationService.generateReport(request);

      // Assert
      expect(result).toBeInstanceOf(Report);
      expect(result.title).toBe('Test Report');
      expect(result.config).toBeDefined();
      expect(result.layout).toBeDefined();
      expect(result.styling).toBeDefined();
      expect(result.isPublic).toBe(false);
    });

    it('should generate report with template reference', () => {
      // Arrange
      const request: ReportGenerationRequest = {
        title: 'Template-based Report',
        templateId: mockTemplateId,
        createdBy: mockUserId,
      };

      // Act
      const result = ReportGenerationService.generateReport(request);

      // Assert
      expect(result.templateId).toBe(mockTemplateId);
    });

    it('should throw ValidationError when title is empty', () => {
      // Arrange
      const request: ReportGenerationRequest = {
        title: '',
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportGenerationService.generateReport(request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when title is only whitespace', () => {
      // Arrange
      const request: ReportGenerationRequest = {
        title: '   ',
        createdBy: mockUserId,
      };

      // Act & Assert
      expect(() => ReportGenerationService.generateReport(request))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when createdBy is not provided', () => {
      // Arrange
      const request = {
        title: 'Test Report',
      } as ReportGenerationRequest;

      // Act & Assert
      expect(() => ReportGenerationService.generateReport(request))
        .toThrow(ValidationError);
    });
  });

  describe('generateReportFromTemplate', () => {
    let mockTemplate: ReportTemplate;

    beforeEach(() => {
      mockTemplate = ReportTemplateFactory.create({
        isActive: true,
        isSystem: false,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      });
    });

    it('should generate report from template with default configuration', () => {
      // Arrange
      const request: ReportFromTemplateRequest = {
        templateId: mockTemplate.id,
        title: 'Report from Template',
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act
      const result = ReportGenerationService.generateReportFromTemplate(mockTemplate, request);

      // Assert
      expect(result).toBeInstanceOf(Report);
      expect(result.title).toBe('Report from Template');
      expect(result.templateId).toBe(mockTemplate.id);
      expect(result.config).toBe(mockTemplate.defaultConfig);
      expect(result.layout).toBe(mockTemplate.defaultLayout);
      expect(result.styling).toBe(mockTemplate.defaultStyling);
    });

    it('should generate report from template with config overrides', () => {
      // Arrange
      const configOverrides = { title: 'Overridden Config Title' };
      const request: ReportFromTemplateRequest = {
        templateId: mockTemplate.id,
        title: 'Report from Template',
        configOverrides,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act
      const result = ReportGenerationService.generateReportFromTemplate(mockTemplate, request);

      // Assert
      expect(result.config).not.toBe(mockTemplate.defaultConfig);
      expect(result.config.title).toBe('Overridden Config Title');
    });

    it('should generate report from template with layout overrides', () => {
      // Arrange
      const layoutOverrides = { components: [] };
      const request: ReportFromTemplateRequest = {
        templateId: mockTemplate.id,
        title: 'Report from Template',
        layoutOverrides,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act
      const result = ReportGenerationService.generateReportFromTemplate(mockTemplate, request);

      // Assert
      expect(result.layout).not.toBe(mockTemplate.defaultLayout);
    });

    it('should generate report from template with styling overrides', () => {
      // Arrange
      const stylingOverrides = { primaryColor: '#ff0000' };
      const request: ReportFromTemplateRequest = {
        templateId: mockTemplate.id,
        title: 'Report from Template',
        stylingOverrides,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act
      const result = ReportGenerationService.generateReportFromTemplate(mockTemplate, request);

      // Assert
      expect(result.styling).not.toBe(mockTemplate.defaultStyling);
      expect(result.styling.primaryColor).toBe('#ff0000');
    });

    it('should use template description when not provided', () => {
      // Arrange
      const request: ReportFromTemplateRequest = {
        templateId: mockTemplate.id,
        title: 'Report from Template',
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act
      const result = ReportGenerationService.generateReportFromTemplate(mockTemplate, request);

      // Assert
      expect(result.description).toBe(mockTemplate.description);
    });

    it('should throw BusinessRuleViolationError when template is inactive', () => {
      // Arrange
      const inactiveTemplate = ReportTemplateFactory.create({
        isActive: false,
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      });

      const request: ReportFromTemplateRequest = {
        templateId: inactiveTemplate.id,
        title: 'Report from Template',
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act & Assert
      expect(() => ReportGenerationService.generateReportFromTemplate(inactiveTemplate, request))
        .toThrow(BusinessRuleViolationError);
    });

    it('should allow access to system templates', () => {
      // Arrange
      const systemTemplate = ReportTemplateFactory.create({
        isActive: true,
        isSystem: true,
      });

      const request: ReportFromTemplateRequest = {
        templateId: systemTemplate.id,
        title: 'Report from System Template',
        createdBy: UniqueId.create('different-user'),
      };

      // Act
      const result = ReportGenerationService.generateReportFromTemplate(systemTemplate, request);

      // Assert
      expect(result).toBeInstanceOf(Report);
      expect(result.templateId).toBe(systemTemplate.id);
    });

    it('should throw BusinessRuleViolationError when user lacks access to non-system template', () => {
      // Arrange
      const privateTemplate = ReportTemplateFactory.create({
        isActive: true,
        isSystem: false,
        createdBy: UniqueId.create('other-user'),
        organizationId: UniqueId.create('other-org'),
      });

      const request: ReportFromTemplateRequest = {
        templateId: privateTemplate.id,
        title: 'Report from Template',
        createdBy: mockUserId,
        organizationId: mockOrganizationId,
      };

      // Act & Assert
      expect(() => ReportGenerationService.generateReportFromTemplate(privateTemplate, request))
        .toThrow(BusinessRuleViolationError);
    });

    it('should throw ValidationError when templateId is not provided', () => {
      // Arrange
      const request = {
        title: 'Report from Template',
        createdBy: mockUserId,
      } as ReportFromTemplateRequest;

      // Act & Assert
      expect(() => ReportGenerationService.generateReportFromTemplate(mockTemplate, request))
        .toThrow(ValidationError);
    });
  });

  describe('validateReportConfiguration', () => {
    it('should return valid result for correct configuration', () => {
      // Arrange
      const config = ReportConfig.createDefault();
      const layout = ReportLayout.createDefault();
      const styling = ReportStyling.createDefault();

      // Act
      const result = ReportGenerationService.validateReportConfiguration(config, layout, styling);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid configuration', () => {
      // Arrange
      const invalidConfig = {} as ReportConfig;
      const layout = ReportLayout.createDefault();
      const styling = ReportStyling.createDefault();

      // Mock validation to throw error
      jest.spyOn(invalidConfig, 'validate').mockImplementation(() => {
        throw new ValidationError('Invalid config');
      });

      // Act
      const result = ReportGenerationService.validateReportConfiguration(invalidConfig, layout, styling);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Config validation: Invalid config');
    });

    it('should collect warnings for potential issues', () => {
      // Arrange
      const config = ReportConfig.createDefault();
      const layout = ReportLayout.createDefault();
      const styling = ReportStyling.createDefault();

      // Act
      const result = ReportGenerationService.validateReportConfiguration(config, layout, styling);

      // Assert
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('cloneReport', () => {
    let originalReport: Report;

    beforeEach(() => {
      originalReport = ReportFactory.create({
        title: 'Original Report',
        description: 'Original Description',
        isPublic: false,
        templateId: mockTemplateId,
        createdBy: UniqueId.create('original-user'),
        organizationId: mockOrganizationId,
      });
    });

    it('should clone report with new title and creator', () => {
      // Arrange
      const newTitle = 'Cloned Report';
      const newCreator = UniqueId.create('new-user');

      // Act
      const result = ReportGenerationService.cloneReport(originalReport, newTitle, newCreator);

      // Assert
      expect(result).toBeInstanceOf(Report);
      expect(result.title).toBe(newTitle);
      expect(result.createdBy).toBe(newCreator);
      expect(result.description).toBe(originalReport.description);
      expect(result.config).toBe(originalReport.config);
      expect(result.layout).toBe(originalReport.layout);
      expect(result.styling).toBe(originalReport.styling);
      expect(result.templateId).toBe(originalReport.templateId);
      expect(result.organizationId).toBe(originalReport.organizationId);
    });

    it('should clone report with modifications', () => {
      // Arrange
      const newTitle = 'Cloned Report';
      const newCreator = UniqueId.create('new-user');
      const modifications = {
        description: 'Modified Description',
        isPublic: true,
        config: { title: 'Modified Config' },
      };

      // Act
      const result = ReportGenerationService.cloneReport(
        originalReport,
        newTitle,
        newCreator,
        modifications
      );

      // Assert
      expect(result.title).toBe(newTitle);
      expect(result.description).toBe('Modified Description');
      expect(result.isPublic).toBe(true);
      expect(result.config).not.toBe(originalReport.config);
    });

    it('should throw ValidationError when new title is empty', () => {
      // Arrange
      const newCreator = UniqueId.create('new-user');

      // Act & Assert
      expect(() => ReportGenerationService.cloneReport(originalReport, '', newCreator))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when new title is only whitespace', () => {
      // Arrange
      const newCreator = UniqueId.create('new-user');

      // Act & Assert
      expect(() => ReportGenerationService.cloneReport(originalReport, '   ', newCreator))
        .toThrow(ValidationError);
    });
  });

  describe('calculateComplexityScore', () => {
    it('should calculate complexity score based on config and layout', () => {
      // Arrange
      const config = ReportConfig.create({
        title: 'Test',
        description: 'Test',
        filters: [{ name: 'filter1' }, { name: 'filter2' }],
        parameters: [{ name: 'param1' }],
        layout: {},
        styling: {},
      });

      const layout = ReportLayout.create({
        components: [
          { type: 'CHART', position: { x: 0, y: 0, width: 1, height: 1 } },
          { type: 'TABLE', position: { x: 1, y: 0, width: 1, height: 1 } },
        ],
        grid: { columns: 12, rows: 10 },
      });

      // Act
      const score = ReportGenerationService.calculateComplexityScore(config, layout);

      // Assert
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    it('should give higher scores for complex components', () => {
      // Arrange
      const config = ReportConfig.createDefault();
      
      const simpleLayout = ReportLayout.create({
        components: [
          { type: 'TEXT', position: { x: 0, y: 0, width: 1, height: 1 } },
        ],
        grid: { columns: 12, rows: 10 },
      });

      const complexLayout = ReportLayout.create({
        components: [
          { type: 'METRIC', position: { x: 0, y: 0, width: 1, height: 1 } },
          { type: 'IMAGE', position: { x: 1, y: 0, width: 1, height: 1 } },
        ],
        grid: { columns: 12, rows: 10 },
      });

      // Act
      const simpleScore = ReportGenerationService.calculateComplexityScore(config, simpleLayout);
      const complexScore = ReportGenerationService.calculateComplexityScore(config, complexLayout);

      // Assert
      expect(complexScore).toBeGreaterThan(simpleScore);
    });
  });

  describe('suggestOptimizations', () => {
    it('should suggest optimizations for high complexity reports', () => {
      // Arrange
      const config = ReportConfig.create({
        title: 'Test',
        description: 'Test',
        filters: Array(15).fill(0).map((_, i) => ({ name: `filter${i}` })),
        parameters: [],
        layout: {},
        styling: {},
      });

      const layout = ReportLayout.create({
        components: Array(20).fill(0).map((_, i) => ({
          type: 'CHART',
          position: { x: i % 4, y: Math.floor(i / 4), width: 1, height: 1 },
        })),
        grid: { columns: 12, rows: 10 },
      });

      // Act
      const suggestions = ReportGenerationService.suggestOptimizations(config, layout);

      // Assert
      expect(suggestions).toContain('Too many filters may impact performance - consider grouping related filters');
      expect(suggestions).toContain('Consider splitting this report into multiple smaller reports');
    });

    it('should suggest optimizations for expensive component combinations', () => {
      // Arrange
      const config = ReportConfig.createDefault();
      
      const layout = ReportLayout.create({
        components: [
          { type: 'CHART', position: { x: 0, y: 0, width: 1, height: 1 } },
          { type: 'CHART', position: { x: 1, y: 0, width: 1, height: 1 } },
          { type: 'CHART', position: { x: 2, y: 0, width: 1, height: 1 } },
          { type: 'CHART', position: { x: 3, y: 0, width: 1, height: 1 } },
          { type: 'METRIC', position: { x: 0, y: 1, width: 2, height: 2 } },
        ],
        grid: { columns: 12, rows: 10 },
      });

      // Act
      const suggestions = ReportGenerationService.suggestOptimizations(config, layout);

      // Assert
      expect(suggestions).toContain('Multiple charts with pivot tables can be resource-intensive - consider pagination');
    });

    it('should return empty suggestions for simple reports', () => {
      // Arrange
      const config = ReportConfig.createDefault();
      const layout = ReportLayout.createDefault();

      // Act
      const suggestions = ReportGenerationService.suggestOptimizations(config, layout);

      // Assert
      expect(suggestions).toHaveLength(0);
    });
  });
});