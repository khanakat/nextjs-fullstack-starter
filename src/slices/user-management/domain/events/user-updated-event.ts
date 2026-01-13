import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Domain Event: User Updated
 * Triggered when user information is updated
 */
export class UserUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UniqueId,
    public readonly oldData: any,
    public readonly newData: any
  ) {
    super();
  }

  getEventName(): string {
    return 'UserUpdated';
  }
}