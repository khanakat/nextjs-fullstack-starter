import { ValueObject } from '../../../../shared/domain/base/value-object';

/**
 * Setting Value Object
 * Value object for setting configuration
 */
export class SettingValueObject extends ValueObject<{ key: string; value: string }> {
  constructor(props: { key: string; value: string }) {
    super(props);
  }

  getKey(): string {
    return this.value.key;
  }

  getSettingValue(): string {
    return this.value.value;
  }

  protected validate(value: { key: string; value: string }): void {
    if (!value.key || value.key.trim() === '') {
      throw new Error('Setting key is required');
    }
    if (value.value === undefined || value.value === null) {
      throw new Error('Setting value is required');
    }
  }
}
