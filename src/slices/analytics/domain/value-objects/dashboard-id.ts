import { ValueObject } from '../../../../shared/domain/base/value-object';

/**
 * Dashboard ID Value Object
 * Unique identifier for analytics dashboards
 */
export class DashboardId extends ValueObject<string> {
  private static readonly LENGTH = 25; // CUID length

  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new Dashboard ID
   */
  static create(value: string): DashboardId {
    return new DashboardId(value);
  }

  /**
   * Validate dashboard ID
   */
  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new Error('Dashboard ID cannot be empty');
    }

    if (value.length !== DashboardId.LENGTH) {
      throw new Error(`Dashboard ID must be ${DashboardId.LENGTH} characters`);
    }

    // CUID format validation (25 characters, alphanumeric)
    const cuidRegex = /^[a-z0-9]{25}$/;
    if (!cuidRegex.test(value)) {
      throw new Error('Dashboard ID must be a valid CUID');
    }
  }
}
