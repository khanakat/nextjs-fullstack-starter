/**
 * Setting DTO
 * Data transfer object for setting
 */
export class SettingDto {
  constructor(
    public readonly key: string,
    public readonly value: string,
  ) {
    this.key = key;
    this.value = value;
  }

  static fromObject(obj: { key: string; value: string }): SettingDto {
    return new SettingDto(obj.key, obj.value);
  }

  toObject(): { key: string; value: string } {
    return {
      key: this.key,
      value: this.value,
    };
  }
}
