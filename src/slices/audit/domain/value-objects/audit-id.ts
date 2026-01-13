import { ValueObject } from '../../../../shared/domain/base/value-object';
import { Result } from '../../../../shared/application/base/result';

/**
 * AuditLog ID Value Object
 * Represents unique identifier of an audit log entry
 */
export class AuditId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<AuditId> {
    if (!value || value.trim().length === 0) {
      return Result.failure(new Error('Audit ID cannot be empty'));
    }

    return Result.success(new AuditId(value));
  }

  public static fromValue(value: string): AuditId {
    return new AuditId(value);
  }

  public getValue(): string {
    return this._value;
  }

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Audit ID cannot be empty');
    }
  }
}
