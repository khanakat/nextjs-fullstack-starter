import { Entity } from '../../base/entity';
import { RoomId } from '../value-objects/room-id';
import { RoomTypeValueObject, RoomType } from '../value-objects/room-type';
import { RoomCreatedEvent, RoomDestroyedEvent } from '../events/room-events';

/**
 * Room Participant
 */
export interface RoomParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  socketId: string;
  joinedAt: Date;
}

/**
 * Collaboration Room Entity
 * Represents a real-time collaboration room
 */
export interface CollaborationRoomProps {
  roomId: RoomId;
  type: RoomTypeValueObject;
  resourceId: string;
  participants: Map<string, RoomParticipant>;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastActivityAt: Date;
}

export class CollaborationRoom extends Entity<RoomId> {
  private _type: RoomTypeValueObject;
  private _resourceId: string;
  private _participants: Map<string, RoomParticipant>;
  private _metadata?: Record<string, any>;
  private _createdAt: Date;
  private _lastActivityAt: Date;

  constructor(props: CollaborationRoomProps) {
    super(props.roomId);
    this._type = props.type;
    this._resourceId = props.resourceId;
    this._participants = props.participants;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt;
    this._lastActivityAt = props.lastActivityAt;
  }

  public static create(props: {
    type: RoomType;
    resourceId: string;
    metadata?: Record<string, any>;
  }): CollaborationRoom {
    const roomId = RoomId.generate(props.type, props.resourceId);
    return new CollaborationRoom({
      roomId,
      type: RoomTypeValueObject.create(props.type),
      resourceId: props.resourceId,
      participants: new Map(),
      metadata: props.metadata,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    });
  }

  public addParticipant(participant: RoomParticipant): void {
    this._participants.set(participant.socketId, participant);
    this._lastActivityAt = new Date();
  }

  public removeParticipant(socketId: string): void {
    this._participants.delete(socketId);
    this._lastActivityAt = new Date();
  }

  public updateParticipantActivity(socketId: string): void {
    const participant = this._participants.get(socketId);
    if (participant) {
      participant.joinedAt = new Date();
      this._lastActivityAt = new Date();
    }
  }

  public updateMetadata(metadata: Record<string, any>): void {
    this._metadata = { ...this._metadata, ...metadata };
    this._lastActivityAt = new Date();
  }

  public destroy(): void {
    this._participants.clear();
    this.addDomainEvent(new RoomDestroyedEvent(this));
  }

  public getParticipantCount(): number {
    return this._participants.size;
  }

  public getParticipants(): RoomParticipant[] {
    return Array.from(this._participants.values());
  }

  public hasParticipant(socketId: string): boolean {
    return this._participants.has(socketId);
  }

  public getParticipant(socketId: string): RoomParticipant | undefined {
    return this._participants.get(socketId);
  }

  public isEmpty(): boolean {
    return this._participants.size === 0;
  }

  // Getters
  public get roomId(): RoomId {
    return this._id;
  }

  public get type(): RoomTypeValueObject {
    return this._type;
  }

  public get resourceId(): string {
    return this._resourceId;
  }

  public get participants(): Map<string, RoomParticipant> {
    return new Map(this._participants);
  }

  public get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get lastActivityAt(): Date {
    return this._lastActivityAt;
  }
}
