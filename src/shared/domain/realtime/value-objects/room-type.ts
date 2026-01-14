import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Room Type Enum
 */
export enum RoomType {
  WORKFLOW = 'workflow',
  ANALYTICS = 'analytics',
  REPORT = 'report',
  INTEGRATION = 'integration',
  DOCUMENT = 'document',
  DASHBOARD = 'dashboard',
}

/**
 * Room Type Value Object
 * Represents the type of collaboration room
 */
export class RoomTypeValueObject extends ValueObject<RoomType> {
  constructor(value: RoomType) {
    super(value);
  }

  protected validate(value: RoomType): void {
    if (!Object.values(RoomType).includes(value)) {
      throw new ValidationError('roomType', `Invalid room type: ${value}`);
    }
  }

  public static create(value: RoomType): RoomTypeValueObject {
    return new RoomTypeValueObject(value);
  }

  public static fromString(value: string): RoomTypeValueObject {
    const normalized = value.toLowerCase();
    if (Object.values(RoomType).includes(normalized as RoomType)) {
      return new RoomTypeValueObject(normalized as RoomType);
    }
    throw new ValidationError('roomType', `Invalid room type: ${value}`);
  }

  public get type(): RoomType {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }
}
