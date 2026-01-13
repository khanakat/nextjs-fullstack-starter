import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Domain Event: User Created
 * Triggered when a new user is created in the system
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly email: string,
    public readonly name?: string
  ) {
    super();
  }

  getEventName(): string {
    return 'UserCreated';
  }
}