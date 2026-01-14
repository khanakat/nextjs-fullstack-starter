import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Room ID Value Object
 * Represents a unique room identifier for collaboration
 */
export class RoomId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('roomId', 'Room ID must be a non-empty string');
    }
    if (value.length < 1 || value.length > 200) {
      throw new ValidationError('roomId', 'Room ID must be between 1 and 200 characters');
    }
  }

  public static create(value: string): RoomId {
    return new RoomId(value);
  }

  public static generate(type: string, resourceId: string): RoomId {
    return new RoomId(`${type}:${resourceId}`);
  }

  public get id(): string {
    return this.value;
  }

  public getType(): string {
    const parts = this.value.split(':');
    return parts[0] || '';
  }

  public getResourceId(): string {
    const parts = this.value.split(':');
    return parts.slice(1).join(':') || '';
  }

  public toString(): string {
    return this.value;
  }
}
