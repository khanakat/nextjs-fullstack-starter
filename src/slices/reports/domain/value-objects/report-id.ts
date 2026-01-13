import { ValueObject } from '../../../../shared/domain/base/value-object';

/**
 * ReportId Value Object
 * Represents unique identifier for a Report
 */
export class ReportId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new ReportId
   */
  static create(): ReportId {
    const id = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return new ReportId(id);
  }

  /**
   * Create ReportId from existing value
   */
  static fromValue(value: string): ReportId {
    return new ReportId(value);
  }

  /**
   * Validate the ReportId value
   */
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('ReportId cannot be empty');
    }
    if (value.length > 100) {
      throw new Error('ReportId cannot exceed 100 characters');
    }
  }

  /**
   * Get the string value
   */
  getValue(): string {
    return this._value;
  }
}
