import { ValueObject } from '../../../../shared/domain/base/value-object';

/**
 * Setting Key Value Object
 * Represents a unique identifier for a setting
 */
export class SettingKey extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): SettingKey {
    return new SettingKey(value);
  }

  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Setting key cannot be empty');
    }
  }

  public getValue(): string {
    return this.value;
  }
}
