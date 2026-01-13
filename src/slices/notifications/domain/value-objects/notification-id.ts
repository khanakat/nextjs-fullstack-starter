import { ValueObject } from '../../../../shared/domain/base/value-object';
import { Result } from '../../../../shared/application/base/result';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';

export class NotificationId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<NotificationId> {
    if (!value || value.trim().length === 0) {
      return Result.failure(new ValidationError('Notification ID cannot be empty', 'value'));
    }

    return Result.success(new NotificationId(value));
  }

  public static fromValue(value: string): NotificationId {
    return new NotificationId(value);
  }

  public getValue(): string {
    return this._value;
  }

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('Notification ID cannot be empty', 'value');
    }
  }
}
