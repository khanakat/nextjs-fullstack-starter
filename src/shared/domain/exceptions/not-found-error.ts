import { DomainError } from './domain-error';

/**
 * Not Found Error for when domain entities are not found
 */
export class NotFoundError extends DomainError {
  public readonly entityType: string;
  public readonly entityId: string;

  constructor(entityType: string, entityId: string) {
    super(`${entityType} with id ${entityId} not found`, 'NOT_FOUND_ERROR');
    this.entityType = entityType;
    this.entityId = entityId;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      entityType: this.entityType,
      entityId: this.entityId,
    };
  }
}