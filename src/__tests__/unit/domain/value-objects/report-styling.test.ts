import { ReportStyling, ReportStylingProps } from '../../../../shared/domain/reporting/value-objects/report-styling';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

describe('ReportStyling', () => {
  let validProps: ReportStylingProps;

  beforeEach(() => {
    validProps = {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
    };
  });

  describe('create', () => {
    it('should create ReportStyling with valid properties', () => {
      // Act
      const styling = ReportStyling.create(validProps);

      // Assert
      expect(styling).toBeInstanceOf(ReportStyling);
      expect(styling.theme).toBe('light');
      expect(styling.primaryColor).toBe('#3b82f6');
      expect(styling.secondaryColor).toBe('#64748b');
      expect(styling.fontFamily).toBe('Inter, sans-serif');
      expect(styling.fontSize).toBe(14);
    });

    it('should create ReportStyling with dark theme', () => {
      // Arrange
      const darkProps = {
        ...validProps,
        theme: 'dark' as const,
      };

      // Act
      const styling = ReportStyling.create(darkProps);

      // Assert
      expect(styling.theme).toBe('dark');
    });

    it('should accept 3-character hex colors', () => {
      // Arrange
      const propsWithShortHex = {
        ...validProps,
        primaryColor: '#f00',
        secondaryColor: '#0f0',
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithShortHex)).not.toThrow();
    });

    it('should accept 6-character hex colors', () => {
      // Arrange
      const propsWithLongHex = {
        ...validProps,
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithLongHex)).not.toThrow();
    });
  });

  describe('validation errors', () => {
    it('should throw ValidationError for invalid theme', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        theme: 'invalid' as any,
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow("Invalid theme: invalid. Must be 'light' or 'dark'");
    });

    it('should throw ValidationError for invalid primary color format', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        primaryColor: 'invalid-color',
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow('Invalid primary color: invalid-color. Must be a valid hex color');
    });

    it('should throw ValidationError for primary color without hash', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        primaryColor: '3b82f6',
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow('Invalid primary color: 3b82f6. Must be a valid hex color');
    });

    it('should throw ValidationError for invalid secondary color format', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        secondaryColor: '#gggggg',
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow('Invalid secondary color: #gggggg. Must be a valid hex color');
    });

    it('should throw ValidationError for empty font family', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        fontFamily: '',
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow('Font family is required');
    });

    it('should throw ValidationError for whitespace-only font family', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        fontFamily: '   ',
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow('Font family is required');
    });

    it('should throw ValidationError for font size below minimum', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        fontSize: 7, // Below minimum of 8
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow('Font size must be between 8 and 72');
    });

    it('should throw ValidationError for font size above maximum', () => {
      // Arrange
      const invalidProps = {
        ...validProps,
        fontSize: 73, // Above maximum of 72
      };

      // Act & Assert
      expect(() => ReportStyling.create(invalidProps))
        .toThrow(ValidationError);
      expect(() => ReportStyling.create(invalidProps))
        .toThrow('Font size must be between 8 and 72');
    });

    it('should accept font size at minimum boundary', () => {
      // Arrange
      const propsWithMinFontSize = {
        ...validProps,
        fontSize: 8,
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithMinFontSize)).not.toThrow();
    });

    it('should accept font size at maximum boundary', () => {
      // Arrange
      const propsWithMaxFontSize = {
        ...validProps,
        fontSize: 72,
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithMaxFontSize)).not.toThrow();
    });
  });

  describe('update methods', () => {
    let styling: ReportStyling;

    beforeEach(() => {
      styling = ReportStyling.create(validProps);
    });

    describe('updateTheme', () => {
      it('should create new ReportStyling with updated theme', () => {
        // Act
        const updatedStyling = styling.updateTheme('dark');

        // Assert
        expect(updatedStyling).not.toBe(styling); // New instance
        expect(updatedStyling.theme).toBe('dark');
        expect(styling.theme).toBe('light'); // Original unchanged
        expect(updatedStyling.primaryColor).toBe(styling.primaryColor); // Other props unchanged
      });

      it('should validate new theme', () => {
        // Act & Assert
        expect(() => styling.updateTheme('invalid' as any))
          .toThrow(ValidationError);
      });
    });

    describe('updatePrimaryColor', () => {
      it('should create new ReportStyling with updated primary color', () => {
        // Arrange
        const newColor = '#ff0000';

        // Act
        const updatedStyling = styling.updatePrimaryColor(newColor);

        // Assert
        expect(updatedStyling).not.toBe(styling);
        expect(updatedStyling.primaryColor).toBe(newColor);
        expect(styling.primaryColor).toBe('#3b82f6'); // Original unchanged
      });

      it('should validate new primary color', () => {
        // Act & Assert
        expect(() => styling.updatePrimaryColor('invalid-color'))
          .toThrow(ValidationError);
      });
    });

    describe('updateSecondaryColor', () => {
      it('should create new ReportStyling with updated secondary color', () => {
        // Arrange
        const newColor = '#00ff00';

        // Act
        const updatedStyling = styling.updateSecondaryColor(newColor);

        // Assert
        expect(updatedStyling).not.toBe(styling);
        expect(updatedStyling.secondaryColor).toBe(newColor);
        expect(styling.secondaryColor).toBe('#64748b'); // Original unchanged
      });

      it('should validate new secondary color', () => {
        // Act & Assert
        expect(() => styling.updateSecondaryColor('#gggggg'))
          .toThrow(ValidationError);
      });
    });

    describe('updateFontFamily', () => {
      it('should create new ReportStyling with updated font family', () => {
        // Arrange
        const newFontFamily = 'Arial, sans-serif';

        // Act
        const updatedStyling = styling.updateFontFamily(newFontFamily);

        // Assert
        expect(updatedStyling).not.toBe(styling);
        expect(updatedStyling.fontFamily).toBe(newFontFamily);
        expect(styling.fontFamily).toBe('Inter, sans-serif'); // Original unchanged
      });

      it('should validate new font family', () => {
        // Act & Assert
        expect(() => styling.updateFontFamily(''))
          .toThrow(ValidationError);
      });
    });

    describe('updateFontSize', () => {
      it('should create new ReportStyling with updated font size', () => {
        // Arrange
        const newFontSize = 16;

        // Act
        const updatedStyling = styling.updateFontSize(newFontSize);

        // Assert
        expect(updatedStyling).not.toBe(styling);
        expect(updatedStyling.fontSize).toBe(newFontSize);
        expect(styling.fontSize).toBe(14); // Original unchanged
      });

      it('should validate new font size', () => {
        // Act & Assert
        expect(() => styling.updateFontSize(5))
          .toThrow(ValidationError);
        expect(() => styling.updateFontSize(80))
          .toThrow(ValidationError);
      });
    });
  });

  describe('theme convenience methods', () => {
    let styling: ReportStyling;

    beforeEach(() => {
      styling = ReportStyling.create(validProps);
    });

    describe('toDarkTheme', () => {
      it('should create dark theme variant', () => {
        // Act
        const darkStyling = styling.toDarkTheme();

        // Assert
        expect(darkStyling).not.toBe(styling);
        expect(darkStyling.theme).toBe('dark');
        expect(darkStyling.primaryColor).toBe(styling.primaryColor); // Other props unchanged
      });
    });

    describe('toLightTheme', () => {
      it('should create light theme variant', () => {
        // Arrange
        const darkStyling = ReportStyling.create({
          ...validProps,
          theme: 'dark',
        });

        // Act
        const lightStyling = darkStyling.toLightTheme();

        // Assert
        expect(lightStyling).not.toBe(darkStyling);
        expect(lightStyling.theme).toBe('light');
        expect(lightStyling.primaryColor).toBe(darkStyling.primaryColor); // Other props unchanged
      });
    });

    describe('isDarkTheme', () => {
      it('should return true for dark theme', () => {
        // Arrange
        const darkStyling = ReportStyling.create({
          ...validProps,
          theme: 'dark',
        });

        // Act & Assert
        expect(darkStyling.isDarkTheme()).toBe(true);
      });

      it('should return false for light theme', () => {
        // Act & Assert
        expect(styling.isDarkTheme()).toBe(false);
      });
    });

    describe('isLightTheme', () => {
      it('should return true for light theme', () => {
        // Act & Assert
        expect(styling.isLightTheme()).toBe(true);
      });

      it('should return false for dark theme', () => {
        // Arrange
        const darkStyling = ReportStyling.create({
          ...validProps,
          theme: 'dark',
        });

        // Act & Assert
        expect(darkStyling.isLightTheme()).toBe(false);
      });
    });
  });

  describe('static factory methods', () => {
    describe('createDefault', () => {
      it('should create default light theme styling', () => {
        // Act
        const defaultStyling = ReportStyling.createDefault();

        // Assert
        expect(defaultStyling.theme).toBe('light');
        expect(defaultStyling.primaryColor).toBe('#3b82f6');
        expect(defaultStyling.secondaryColor).toBe('#64748b');
        expect(defaultStyling.fontFamily).toBe('Inter, sans-serif');
        expect(defaultStyling.fontSize).toBe(14);
      });
    });

    describe('createDarkDefault', () => {
      it('should create default dark theme styling', () => {
        // Act
        const darkDefaultStyling = ReportStyling.createDarkDefault();

        // Assert
        expect(darkDefaultStyling.theme).toBe('dark');
        expect(darkDefaultStyling.primaryColor).toBe('#60a5fa');
        expect(darkDefaultStyling.secondaryColor).toBe('#94a3b8');
        expect(darkDefaultStyling.fontFamily).toBe('Inter, sans-serif');
        expect(darkDefaultStyling.fontSize).toBe(14);
      });
    });
  });

  describe('validation methods', () => {
    describe('isValid', () => {
      it('should return true for valid styling', () => {
        // Arrange
        const styling = ReportStyling.create(validProps);

        // Act
        const isValid = styling.isValid();

        // Assert
        expect(isValid).toBe(true);
      });

      it('should return false for invalid styling (simulated)', () => {
        // Arrange
        const styling = ReportStyling.create(validProps);
        
        // Mock the validation to simulate failure
        const originalValidate = ReportStyling['validateStatic'];
        ReportStyling['validateStatic'] = jest.fn(() => {
          throw new ValidationError('Simulated validation error');
        });

        // Act
        const isValid = styling.isValid();

        // Assert
        expect(isValid).toBe(false);

        // Cleanup
        ReportStyling['validateStatic'] = originalValidate;
      });
    });

    describe('validateConfiguration', () => {
      it('should not throw for valid configuration', () => {
        // Arrange
        const styling = ReportStyling.create(validProps);

        // Act & Assert
        expect(() => styling.validateConfiguration()).not.toThrow();
      });

      it('should throw ValidationError for invalid configuration (simulated)', () => {
        // Arrange
        const styling = ReportStyling.create(validProps);
        
        // Mock the validation to simulate failure
        const originalValidate = ReportStyling['validateStatic'];
        ReportStyling['validateStatic'] = jest.fn(() => {
          throw new ValidationError('Simulated validation error');
        });

        // Act & Assert
        expect(() => styling.validateConfiguration())
          .toThrow(ValidationError);

        // Cleanup
        ReportStyling['validateStatic'] = originalValidate;
      });
    });
  });

  describe('value object equality', () => {
    it('should be equal when all properties are the same', () => {
      // Arrange
      const styling1 = ReportStyling.create(validProps);
      const styling2 = ReportStyling.create(validProps);

      // Act & Assert
      expect(styling1.equals(styling2)).toBe(true);
    });

    it('should not be equal when theme differs', () => {
      // Arrange
      const styling1 = ReportStyling.create(validProps);
      const styling2 = ReportStyling.create({
        ...validProps,
        theme: 'dark',
      });

      // Act & Assert
      expect(styling1.equals(styling2)).toBe(false);
    });

    it('should not be equal when primary color differs', () => {
      // Arrange
      const styling1 = ReportStyling.create(validProps);
      const styling2 = ReportStyling.create({
        ...validProps,
        primaryColor: '#ff0000',
      });

      // Act & Assert
      expect(styling1.equals(styling2)).toBe(false);
    });

    it('should not be equal when secondary color differs', () => {
      // Arrange
      const styling1 = ReportStyling.create(validProps);
      const styling2 = ReportStyling.create({
        ...validProps,
        secondaryColor: '#00ff00',
      });

      // Act & Assert
      expect(styling1.equals(styling2)).toBe(false);
    });

    it('should not be equal when font family differs', () => {
      // Arrange
      const styling1 = ReportStyling.create(validProps);
      const styling2 = ReportStyling.create({
        ...validProps,
        fontFamily: 'Arial, sans-serif',
      });

      // Act & Assert
      expect(styling1.equals(styling2)).toBe(false);
    });

    it('should not be equal when font size differs', () => {
      // Arrange
      const styling1 = ReportStyling.create(validProps);
      const styling2 = ReportStyling.create({
        ...validProps,
        fontSize: 16,
      });

      // Act & Assert
      expect(styling1.equals(styling2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should create new instances when updating', () => {
      // Arrange
      const styling = ReportStyling.create(validProps);

      // Act
      const updatedTheme = styling.updateTheme('dark');
      const updatedColor = styling.updatePrimaryColor('#ff0000');
      const updatedFont = styling.updateFontFamily('Arial');
      const updatedSize = styling.updateFontSize(16);

      // Assert
      expect(updatedTheme).not.toBe(styling);
      expect(updatedColor).not.toBe(styling);
      expect(updatedFont).not.toBe(styling);
      expect(updatedSize).not.toBe(styling);
      
      // All should be different instances
      expect(updatedTheme).not.toBe(updatedColor);
      expect(updatedColor).not.toBe(updatedFont);
      expect(updatedFont).not.toBe(updatedSize);
    });

    it('should preserve original values after updates', () => {
      // Arrange
      const styling = ReportStyling.create(validProps);

      // Act
      styling.updateTheme('dark');
      styling.updatePrimaryColor('#ff0000');
      styling.updateFontSize(20);

      // Assert - Original should be unchanged
      expect(styling.theme).toBe('light');
      expect(styling.primaryColor).toBe('#3b82f6');
      expect(styling.fontSize).toBe(14);
    });
  });

  describe('color validation edge cases', () => {
    it('should accept lowercase hex colors', () => {
      // Arrange
      const propsWithLowercase = {
        ...validProps,
        primaryColor: '#abcdef',
        secondaryColor: '#123456',
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithLowercase)).not.toThrow();
    });

    it('should accept uppercase hex colors', () => {
      // Arrange
      const propsWithUppercase = {
        ...validProps,
        primaryColor: '#ABCDEF',
        secondaryColor: '#123456',
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithUppercase)).not.toThrow();
    });

    it('should accept mixed case hex colors', () => {
      // Arrange
      const propsWithMixedCase = {
        ...validProps,
        primaryColor: '#AbCdEf',
        secondaryColor: '#12A4B6',
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithMixedCase)).not.toThrow();
    });

    it('should reject colors with invalid length', () => {
      // Arrange
      const propsWithInvalidLength = {
        ...validProps,
        primaryColor: '#12345', // 5 characters
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithInvalidLength))
        .toThrow(ValidationError);
    });

    it('should reject colors with too many characters', () => {
      // Arrange
      const propsWithTooManyChars = {
        ...validProps,
        primaryColor: '#1234567', // 7 characters
      };

      // Act & Assert
      expect(() => ReportStyling.create(propsWithTooManyChars))
        .toThrow(ValidationError);
    });
  });
});