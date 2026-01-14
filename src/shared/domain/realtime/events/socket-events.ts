import { DomainEvent } from '../../base/domain-event';
import { SocketConnection } from '../entities/socket-connection';

/**
 * Socket Connected Event
 * Emitted when a socket connection is established
 */
export class SocketConnectedEvent extends DomainEvent {
  constructor(
    public readonly connection: SocketConnection
  ) {
    super();
  }

  getEventName(): string {
    return 'SocketConnected';
  }

  get aggregateId(): string {
    return this.connection.socketId.value;
  }
}

/**
 * Socket Disconnected Event
 * Emitted when a socket connection is closed
 */
export class SocketDisconnectedEvent extends DomainEvent {
  constructor(
    public readonly connection: SocketConnection
  ) {
    super();
  }

  getEventName(): string {
    return 'SocketDisconnected';
  }

  get aggregateId(): string {
    return this.connection.socketId.value;
  }
}

/**
 * Socket Error Event
 * Emitted when a socket error occurs
 */
export class SocketErrorEvent extends DomainEvent {
  constructor(
    public readonly connection: SocketConnection,
    public readonly error: Error
  ) {
    super();
  }

  getEventName(): string {
    return 'SocketError';
  }

  get aggregateId(): string {
    return this.connection.socketId.value;
  }
}
