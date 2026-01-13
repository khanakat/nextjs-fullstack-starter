import { ValueObject } from '../../../../shared/domain/base/value-object';

/**
 * Setting Entity
 * Represents a global application setting with a key and value
 */
export class Setting extends ValueObject<{ key: string; value: string; description?: string }> {
  private constructor(props: { key: string; value: string; description?: string }) {
    super(props);
  }

  public getKey(): string {
    return this._value.key;
  }

  public getSettingValue(): string {
    return this._value.value;
  }

  public getDescription(): string | undefined {
    return this._value.description;
  }

  public updateValue(value: string): Setting {
    return new Setting({
      key: this._value.key,
      value,
      description: this._value.description,
    });
  }

  public updateDescription(description: string): Setting {
    return new Setting({
      key: this._value.key,
      value: this._value.value,
      description,
    });
  }

  protected validate(value: { key: string; value: string; description?: string }): void {
    if (!value.key || value.key.trim() === '') {
      throw new Error('Setting key is required');
    }
    if (value.value === undefined || value.value === null) {
      throw new Error('Setting value is required');
    }
  }

  public static create(props: { key: string; value: string; description?: string }): Setting {
    return new Setting(props);
  }
}
