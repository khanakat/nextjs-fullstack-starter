import { ValueObject } from '../../base/value-object';
import { ValidationError } from '../../exceptions/validation-error';

/**
 * Socket ID Value Object
 * Represents a unique Socket.IO connection identifier
 */
export class SocketId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('socketId', 'Socket ID must be a non-empty string');
    }
    if (value.length < 1 || value.length > 100) {
      throw new ValidationError('socketId', 'Socket ID must be between 1 and 100 characters');
    }
  }

  public static create(value: string): SocketId {
    return new SocketId(value);
  }

  public static generate(): SocketId {
    // Socket.IO generates its own IDs, this is for testing purposes
    const randomId = Math.random().toString(36).substring(2, 15);
    return new SocketId(randomId);
  }

  public get id(): string {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }
}
