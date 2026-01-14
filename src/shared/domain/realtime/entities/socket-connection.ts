import { Entity } from '../../base/entity';
import { SocketId } from '../value-objects/socket-id';
import { ConnectionStatus } from '../value-objects/connection-status';
import { RoomId } from '../value-objects/room-id';
import { SocketConnectedEvent, SocketDisconnectedEvent } from '../events/socket-events';

/**
 * Socket Connection Entity
 * Represents a real-time socket connection
 */
export interface SocketConnectionProps {
  socketId: SocketId;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  organizationId: string;
  status: ConnectionStatus;
  currentRoom?: RoomId;
  connectedAt: Date;
  lastActivityAt: Date;
  metadata?: Record<string, any>;
}

export class SocketConnection extends Entity<SocketId> {
  private _userId: string;
  private _userName: string;
  private _userEmail: string;
  private _userAvatar?: string;
  private _organizationId: string;
  private _status: ConnectionStatus;
  private _currentRoom?: RoomId;
  private _connectedAt: Date;
  private _lastActivityAt: Date;
  private _metadata?: Record<string, any>;

  constructor(props: SocketConnectionProps) {
    super(props.socketId);
    this._userId = props.userId;
    this._userName = props.userName;
    this._userEmail = props.userEmail;
    this._userAvatar = props.userAvatar;
    this._organizationId = props.organizationId;
    this._status = props.status;
    this._currentRoom = props.currentRoom;
    this._connectedAt = props.connectedAt;
    this._lastActivityAt = props.lastActivityAt;
    this._metadata = props.metadata;

    // Emit connected event if status is connected
    if (props.status.isConnected()) {
      this.addDomainEvent(new SocketConnectedEvent(this));
    }
  }

  public static create(props: Omit<SocketConnectionProps, 'status' | 'connectedAt' | 'lastActivityAt'>): SocketConnection {
    return new SocketConnection({
      ...props,
      status: ConnectionStatus.connected(),
      connectedAt: new Date(),
      lastActivityAt: new Date(),
    });
  }

  public disconnect(): void {
    this._status = ConnectionStatus.disconnected();
    this._currentRoom = undefined;
    this._lastActivityAt = new Date();
    this.addDomainEvent(new SocketDisconnectedEvent(this));
  }

  public joinRoom(roomId: RoomId): void {
    this._currentRoom = roomId;
    this._lastActivityAt = new Date();
  }

  public leaveRoom(): void {
    this._currentRoom = undefined;
    this._lastActivityAt = new Date();
  }

  public updateActivity(): void {
    this._lastActivityAt = new Date();
  }

  public updateStatus(status: ConnectionStatus): void {
    this._status = status;
    this._lastActivityAt = new Date();
  }

  public updateMetadata(metadata: Record<string, any>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._lastActivityAt = new Date();
  }

  // Getters
  public get socketId(): SocketId {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get userName(): string {
    return this._userName;
  }

  public get userEmail(): string {
    return this._userEmail;
  }

  public get userAvatar(): string | undefined {
    return this._userAvatar;
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get status(): ConnectionStatus {
    return this._status;
  }

  public get currentRoom(): RoomId | undefined {
    return this._currentRoom;
  }

  public get connectedAt(): Date {
    return this._connectedAt;
  }

  public get lastActivityAt(): Date {
    return this._lastActivityAt;
  }

  public get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  public isConnected(): boolean {
    return this._status.isConnected();
  }

  public isDisconnected(): boolean {
    return this._status.isDisconnected();
  }

  public isInRoom(roomId: RoomId): boolean {
    return this._currentRoom?.equals(roomId) ?? false;
  }
}
