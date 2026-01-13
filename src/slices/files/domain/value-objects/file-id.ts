import { ValueObject } from '../../../../shared/domain/base/value-object';
import { Result } from '../../../../shared/application/base/result';

/**
 * File ID Value Object
 * Represents unique identifier for a file
 */
export class FileId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<FileId> {
    if (!value || value.trim().length === 0) {
      return Result.failure(new Error('File ID cannot be empty'));
    }

    return Result.success(new FileId(value));
  }

  public static fromValue(value: string): FileId {
    return new FileId(value);
  }

  public getValue(): string {
    return this._value;
  }

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('File ID cannot be empty');
    }
  }
}
