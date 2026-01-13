import { ReportConfig, ReportConfigProps } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

describe('ReportConfig', () => {
  let mockLayout: ReportLayout;
  let mockStyling: ReportStyling;
  let validProps: ReportConfigProps;

  beforeEach(() => {
    mockLayout = ReportLayout.create({
      type: 'GRID',
      components: [
        {
          id: 'chart-1',
          type: 'CHART',
          position: { x: 0, y: 0 },
          size: { width: 6, height: 4 },
          config: { chartType: 'bar' },
        },
      ],
      grid: {
        columns: 12,
        rows: 8,
        gap: 16,
      },
    });

    mockStyling = ReportStyling.create({
      theme: 'light',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial',
      fontSize: 14,
    });

    validProps = {
      title: 'Sales Report',
      description: 'Monthly sales analysis',
      templateId: 'template-123',
      filters: { region: 'US', period: '2024-01' },
      parameters: { includeCharts: true, format: 'PDF' },
      layout: mockLayout,
      styling: mockStyling,
    };
  });

  describe('create', () => {
    it('should create ReportConfig with valid properties', () => {
      // Act
      const config = ReportConfig.create(validProps);

      // Assert
      expect(config).toBeInstanceOf(ReportConfig);
      expect(config.title).toBe('Sales Report');
      expect(config.description).toBe('Monthly sales analysis');
      expect(config.templateId).toBe('template-123');
      expect(config.filters).toEqual({ region: 'US', period: '2024-01' });
      expect(config.parameters).toEqual({ includeCharts: true, format: 'PDF' });
      expect(config.layout).toBe(mockLayout);
      expect(config.styling).toBe(mockStyling);
    });

    it('should create ReportConfig without optional properties', () => {
      // Arrange
      const minimalProps = {
        title: 'Minimal Report',
        filters: {},
        parameters: {},
        layout: mockLayout,
        styling: mockStyling,
      };

      // Act
      const config = ReportConfig.create(minimalProps);

      // Assert
      expect(config.title).toBe('Minimal Report');
      expect(config.description).toBeUndefined();
      expect(config.templateId).toBeUndefined();
      expect(config.filters).toEqual({});
      expect(config.parameters).toEqual({});
    });

    it('should throw ValidationError when title is empty', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        title: '',
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report title is required');
    });

    it('should throw ValidationError when title is only whitespace', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        title: '   ',
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report title is required');
    });

    it('should throw ValidationError when title exceeds 255 characters', () => {
      // Arrange
      const longTitle = 'a'.repeat(256);
      const invalidProps = {
        ...validProps,
        title: longTitle,
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report title cannot exceed 255 characters');
    });

    it('should throw ValidationError when description exceeds 1000 characters', () => {
      // Arrange
      const longDescription = 'a'.repeat(1001);
      const invalidProps = {
        ...validProps,
        description: longDescription,
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report description cannot exceed 1000 characters');
    });

    it('should throw ValidationError when filters is not an object', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        filters: 'invalid' as any,
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report filters must be a valid object');
    });

    it('should throw ValidationError when filters is null', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        filters: null as any,
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report filters must be a valid object');
    });

    it('should throw ValidationError when parameters is not an object', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        parameters: 'invalid' as any,
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report parameters must be a valid object');
    });

    it('should throw ValidationError when layout is missing', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        layout: null as any,
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report layout is required');
    });

    it('should throw ValidationError when styling is missing', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        styling: null as any,
      };

      // Act & Assert
      expect(() => ReportConfig.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportConfig.create(invalidProps))
        .toThrow('Report styling is required');
    });
  });

  describe('getters', () => {
    let config: ReportConfig;

    beforeEach(() => {
      config = ReportConfig.create(validProps);
    });

    it('should return immutable copies of filters', () => {
      // Act
      const filters1 = config.filters;
      const filters2 = config.filters;

      // Assert
      expect(filters1).toEqual(filters2);
      expect(filters1).not.toBe(filters2); // Different objects
      
      // Modify returned object should not affect original
      filters1.newProperty = 'test';
      expect(config.filters).not.toHaveProperty('newProperty');
    });

    it('should return immutable copies of parameters', () => {
      // Act
      const parameters1 = config.parameters;
      const parameters2 = config.parameters;

      // Assert
      expect(parameters1).toEqual(parameters2);
      expect(parameters1).not.toBe(parameters2); // Different objects
      
      // Modify returned object should not affect original
      parameters1.newProperty = 'test';
      expect(config.parameters).not.toHaveProperty('newProperty');
    });
  });

  describe('updateTitle', () => {
    it('should create new ReportConfig with updated title', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newTitle = 'Updated Sales Report';

      // Act
      const updatedConfig = config.updateTitle(newTitle);

      // Assert
      expect(updatedConfig).not.toBe(config); // New instance
      expect(updatedConfig.title).toBe(newTitle);
      expect(config.title).toBe('Sales Report'); // Original unchanged
      expect(updatedConfig.description).toBe(config.description);
      expect(updatedConfig.filters).toEqual(config.filters);
    });

    it('should validate new title', () => {
      // Arrange
      const config = ReportConfig.create(validProps);

      // Act & Assert
      expect(() => config.updateTitle(''))
        .toThrow(ValidationError);
      expect(() => config.updateTitle('a'.repeat(256)))
        .toThrow(ValidationError);
    });
  });

  describe('updateDescription', () => {
    it('should create new ReportConfig with updated description', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newDescription = 'Updated monthly sales analysis';

      // Act
      const updatedConfig = config.updateDescription(newDescription);

      // Assert
      expect(updatedConfig).not.toBe(config);
      expect(updatedConfig.description).toBe(newDescription);
      expect(config.description).toBe('Monthly sales analysis');
    });

    it('should allow setting description to undefined', () => {
      // Arrange
      const config = ReportConfig.create(validProps);

      // Act
      const updatedConfig = config.updateDescription(undefined);

      // Assert
      expect(updatedConfig.description).toBeUndefined();
    });

    it('should validate new description length', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const longDescription = 'a'.repeat(1001);

      // Act & Assert
      expect(() => config.updateDescription(longDescription))
        .toThrow(ValidationError);
    });
  });

  describe('updateFilters', () => {
    it('should merge new filters with existing ones', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newFilters = { department: 'Sales', active: true };

      // Act
      const updatedConfig = config.updateFilters(newFilters);

      // Assert
      expect(updatedConfig.filters).toEqual({
        region: 'US',
        period: '2024-01',
        department: 'Sales',
        active: true,
      });
      expect(config.filters).toEqual({ region: 'US', period: '2024-01' });
    });

    it('should override existing filter values', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newFilters = { region: 'EU', newFilter: 'value' };

      // Act
      const updatedConfig = config.updateFilters(newFilters);

      // Assert
      expect(updatedConfig.filters).toEqual({
        region: 'EU', // Overridden
        period: '2024-01', // Preserved
        newFilter: 'value', // Added
      });
    });
  });

  describe('updateParameters', () => {
    it('should merge new parameters with existing ones', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newParameters = { showTotals: true, currency: 'USD' };

      // Act
      const updatedConfig = config.updateParameters(newParameters);

      // Assert
      expect(updatedConfig.parameters).toEqual({
        includeCharts: true,
        format: 'PDF',
        showTotals: true,
        currency: 'USD',
      });
      expect(config.parameters).toEqual({ includeCharts: true, format: 'PDF' });
    });

    it('should override existing parameter values', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newParameters = { format: 'EXCEL', newParam: 'value' };

      // Act
      const updatedConfig = config.updateParameters(newParameters);

      // Assert
      expect(updatedConfig.parameters).toEqual({
        includeCharts: true, // Preserved
        format: 'EXCEL', // Overridden
        newParam: 'value', // Added
      });
    });
  });

  describe('updateLayout', () => {
    it('should create new ReportConfig with updated layout', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newLayout = ReportLayout.create({
        type: 'FREEFORM',
        components: [],
        grid: { columns: 10, rows: 6, gap: 8 },
      });

      // Act
      const updatedConfig = config.updateLayout(newLayout);

      // Assert
      expect(updatedConfig).not.toBe(config);
      expect(updatedConfig.layout).toBe(newLayout);
      expect(config.layout).toBe(mockLayout);
    });
  });

  describe('updateStyling', () => {
    it('should create new ReportConfig with updated styling', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      const newStyling = ReportStyling.create({
        theme: 'dark',
        primaryColor: '#28a745',
        secondaryColor: '#6c757d',
        fontFamily: 'Helvetica',
        fontSize: 16,
      });

      // Act
      const updatedConfig = config.updateStyling(newStyling);

      // Assert
      expect(updatedConfig).not.toBe(config);
      expect(updatedConfig.styling).toBe(newStyling);
      expect(config.styling).toBe(mockStyling);
    });
  });

  describe('isValidForPublishing', () => {
    it('should return true for valid configuration', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      
      // Mock layout and styling validation
      jest.spyOn(mockLayout, 'isValid').mockReturnValue(true);
      jest.spyOn(mockStyling, 'isValid').mockReturnValue(true);

      // Act
      const isValid = config.isValidForPublishing();

      // Assert
      expect(isValid).toBe(true);
    });

    it('should return true when all components are valid', () => {
      // Arrange
      const config = ReportConfig.create(validProps);

      // Mock layout and styling validation
      jest.spyOn(mockLayout, 'isValid').mockReturnValue(true);
      jest.spyOn(mockStyling, 'isValid').mockReturnValue(true);

      // Act
      const isValid = config.isValidForPublishing();

      // Assert
      expect(isValid).toBe(true);
    });

    it('should return false when layout is invalid', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      
      // Mock layout and styling validation
      jest.spyOn(mockLayout, 'isValid').mockReturnValue(false);
      jest.spyOn(mockStyling, 'isValid').mockReturnValue(true);

      // Act
      const isValid = config.isValidForPublishing();

      // Assert
      expect(isValid).toBe(false);
    });

    it('should return false when styling is invalid', () => {
      // Arrange
      const config = ReportConfig.create(validProps);
      
      // Mock layout and styling validation
      jest.spyOn(mockLayout, 'isValid').mockReturnValue(true);
      jest.spyOn(mockStyling, 'isValid').mockReturnValue(false);

      // Act
      const isValid = config.isValidForPublishing();

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('value object equality', () => {
    it('should be equal when all properties are the same', () => {
      // Arrange
      const config1 = ReportConfig.create(validProps);
      const config2 = ReportConfig.create(validProps);

      // Act & Assert
      expect(config1.equals(config2)).toBe(true);
    });

    it('should not be equal when titles differ', () => {
      // Arrange
      const config1 = ReportConfig.create(validProps);
      const config2 = ReportConfig.create({
        ...validProps,
        title: 'Different Title',
      });

      // Act & Assert
      expect(config1.equals(config2)).toBe(false);
    });

    it('should not be equal when filters differ', () => {
      // Arrange
      const config1 = ReportConfig.create(validProps);
      const config2 = ReportConfig.create({
        ...validProps,
        filters: { region: 'EU' },
      });

      // Act & Assert
      expect(config1.equals(config2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not allow direct modification of internal state', () => {
      // Arrange
      const config = ReportConfig.create(validProps);

      // Act - Try to modify returned objects
      const filters = config.filters;
      const parameters = config.parameters;
      
      filters.newProperty = 'test';
      parameters.newProperty = 'test';

      // Assert - Original config should be unchanged
      expect(config.filters).not.toHaveProperty('newProperty');
      expect(config.parameters).not.toHaveProperty('newProperty');
    });

    it('should create new instances when updating', () => {
      // Arrange
      const config = ReportConfig.create(validProps);

      // Act
      const updatedTitle = config.updateTitle('New Title');
      const updatedFilters = config.updateFilters({ newFilter: 'value' });

      // Assert
      expect(updatedTitle).not.toBe(config);
      expect(updatedFilters).not.toBe(config);
      expect(updatedTitle).not.toBe(updatedFilters);
    });
  });
});