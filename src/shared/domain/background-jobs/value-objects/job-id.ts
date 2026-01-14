import { ValueObject } from '../../base/value-object';

/**
 * Job ID Value Object
 * Represents a unique job identifier
 */
export class JobId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): JobId {
    if (!value || value.trim().length === 0) {
      throw new Error('Job ID cannot be empty');
    }
    return new JobId(value);
  }

  public static fromValue(value: string): JobId {
    return new JobId(value);
  }

  public getValue(): string {
    return this._value;
  }
}
