import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

export interface ReportStylingProps {
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
}

/**
 * Report Styling Value Object
 * Encapsulates all styling configuration for a report
 */
export class ReportStyling extends ValueObject<ReportStylingProps> {
  private static readonly VALID_THEMES = ['light', 'dark'] as const;
  private static readonly MIN_FONT_SIZE = 8;
  private static readonly MAX_FONT_SIZE = 72;
  private static readonly COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  private constructor(props: ReportStylingProps) {
    super(props);
  }

  protected validate(props: ReportStylingProps): void {
    ReportStyling.validateStatic(props);
  }

  // Accept both flat props and nested DTO-like props
  public static create(props: any): ReportStyling {
    const normalized = ReportStyling.normalizeProps(props);
    ReportStyling.validateStatic(normalized);
    return new ReportStyling(normalized);
  }

  private static normalizeProps(input: any): ReportStylingProps {
    // Flat shape: { theme, primaryColor, secondaryColor, fontFamily, fontSize }
    if (
      input &&
      (Object.prototype.hasOwnProperty.call(input, 'primaryColor') ||
        Object.prototype.hasOwnProperty.call(input, 'secondaryColor'))
    ) {
      return {
        theme: input.theme,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        fontFamily: input.fontFamily,
        fontSize: input.fontSize,
      } as ReportStylingProps;
    }

    // DTO-like nested shape: { theme, colors: { primary, secondary }, fonts: { family, sizes: { medium|base|small } } }
    const fonts = input?.fonts ?? {};
    const sizes = fonts?.sizes ?? {};
    const fontSize = sizes.medium ?? sizes.base ?? sizes.small ?? 14;

    return {
      theme: input?.theme,
      primaryColor: input?.colors?.primary,
      secondaryColor: input?.colors?.secondary,
      fontFamily: fonts?.family,
      fontSize,
    } as ReportStylingProps;
  }

  private static validateStatic(props: ReportStylingProps): void {
    if (!ReportStyling.VALID_THEMES.includes(props.theme)) {
      throw new ValidationError('theme', `Invalid theme: ${props.theme}. Must be 'light' or 'dark'`);
    }

    if (!ReportStyling.isValidColor(props.primaryColor)) {
      throw new ValidationError('primaryColor', `Invalid primary color: ${props.primaryColor}. Must be a valid hex color`);
    }

    if (!ReportStyling.isValidColor(props.secondaryColor)) {
      throw new ValidationError('secondaryColor', `Invalid secondary color: ${props.secondaryColor}. Must be a valid hex color`);
    }

    if (!props.fontFamily || props.fontFamily.trim().length === 0) {
      throw new ValidationError('fontFamily', 'Font family is required');
    }

    if (props.fontSize < ReportStyling.MIN_FONT_SIZE || props.fontSize > ReportStyling.MAX_FONT_SIZE) {
      throw new ValidationError(
        'fontSize',
        `Font size must be between ${ReportStyling.MIN_FONT_SIZE} and ${ReportStyling.MAX_FONT_SIZE}`
      );
    }
  }

  private static isValidColor(color: string): boolean {
    return ReportStyling.COLOR_REGEX.test(color);
  }

  get theme(): 'light' | 'dark' {
    return this._value.theme;
  }

  get primaryColor(): string {
    return this._value.primaryColor;
  }

  get secondaryColor(): string {
    return this._value.secondaryColor;
  }

  get fontFamily(): string {
    return this._value.fontFamily;
  }

  get fontSize(): number {
    return this._value.fontSize;
  }

  /**
   * Updates the theme
   */
  public updateTheme(theme: 'light' | 'dark'): ReportStyling {
    return ReportStyling.create({
      ...this._value,
      theme,
    });
  }

  /**
   * Updates the primary color
   */
  public updatePrimaryColor(primaryColor: string): ReportStyling {
    return ReportStyling.create({
      ...this._value,
      primaryColor,
    });
  }

  /**
   * Updates the secondary color
   */
  public updateSecondaryColor(secondaryColor: string): ReportStyling {
    return ReportStyling.create({
      ...this._value,
      secondaryColor,
    });
  }

  /**
   * Updates the font family
   */
  public updateFontFamily(fontFamily: string): ReportStyling {
    return ReportStyling.create({
      ...this._value,
      fontFamily,
    });
  }

  /**
   * Updates the font size
   */
  public updateFontSize(fontSize: number): ReportStyling {
    return ReportStyling.create({
      ...this._value,
      fontSize,
    });
  }

  /**
   * Creates a dark theme variant
   */
  public toDarkTheme(): ReportStyling {
    return this.updateTheme('dark');
  }

  /**
   * Creates a light theme variant
   */
  public toLightTheme(): ReportStyling {
    return this.updateTheme('light');
  }

  /**
   * Checks if the styling is valid
   */
  public isValid(): boolean {
    try {
      ReportStyling.validateStatic(this._value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates the current styling configuration
   */
  public validateConfiguration(): void {
    ReportStyling.validateStatic(this._value);
  }

  /**
   * Creates default light theme styling
   */
  public static createDefault(): ReportStyling {
    return ReportStyling.create({
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
    });
  }

  /**
   * Creates default dark theme styling
   */
  public static createDarkDefault(): ReportStyling {
    return ReportStyling.create({
      theme: 'dark',
      primaryColor: '#60a5fa',
      secondaryColor: '#94a3b8',
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
    });
  }

  /**
   * Checks if the current theme is dark
   */
  public isDarkTheme(): boolean {
    return this._value.theme === 'dark';
  }

  /**
   * Checks if the current theme is light
   */
  public isLightTheme(): boolean {
    return this._value.theme === 'light';
  }

  /**
   * Converts the styling to a plain JSON object
   */
  public toJSON(): Record<string, any> {
    return {
      theme: this.theme,
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
    };
  }
}