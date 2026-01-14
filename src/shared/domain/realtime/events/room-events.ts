import { DomainEvent } from '../../base/domain-event';
import { CollaborationRoom } from '../entities/collaboration-room';
import { RoomParticipant } from '../entities/collaboration-room';

/**
 * Room Created Event
 * Emitted when a collaboration room is created
 */
export class RoomCreatedEvent extends DomainEvent {
  constructor(
    public readonly room: CollaborationRoom
  ) {
    super();
  }

  getEventName(): string {
    return 'RoomCreated';
  }

  get aggregateId(): string {
    return this.room.roomId.value;
  }
}

/**
 * Room Destroyed Event
 * Emitted when a collaboration room is destroyed
 */
export class RoomDestroyedEvent extends DomainEvent {
  constructor(
    public readonly room: CollaborationRoom
  ) {
    super();
  }

  getEventName(): string {
    return 'RoomDestroyed';
  }

  get aggregateId(): string {
    return this.room.roomId.value;
  }
}

/**
 * User Joined Room Event
 * Emitted when a user joins a room
 */
export class UserJoinedRoomEvent extends DomainEvent {
  constructor(
    public readonly room: CollaborationRoom,
    public readonly participant: RoomParticipant
  ) {
    super();
  }

  getEventName(): string {
    return 'UserJoinedRoom';
  }

  get aggregateId(): string {
    return this.room.roomId.value;
  }
}

/**
 * User Left Room Event
 * Emitted when a user leaves a room
 */
export class UserLeftRoomEvent extends DomainEvent {
  constructor(
    public readonly room: CollaborationRoom,
    public readonly participant: RoomParticipant
  ) {
    super();
  }

  getEventName(): string {
    return 'UserLeftRoom';
  }

  get aggregateId(): string {
    return this.room.roomId.value;
  }
}

/**
 * Room Metadata Updated Event
 * Emitted when room metadata is updated
 */
export class RoomMetadataUpdatedEvent extends DomainEvent {
  constructor(
    public readonly room: CollaborationRoom,
    public readonly metadata: Record<string, any>
  ) {
    super();
  }

  getEventName(): string {
    return 'RoomMetadataUpdated';
  }

  get aggregateId(): string {
    return this.room.roomId.value;
  }
}
