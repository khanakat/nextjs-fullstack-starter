import { Dto } from '../../base/dto';

/**
 * Room Participant DTO
 */
export interface RoomParticipantDto {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  socketId: string;
  joinedAt: Date;
}

/**
 * Collaboration Room DTO
 */
export class CollaborationRoomDto extends Dto {
  constructor(
    id: string,
    createdAt: Date,
    public readonly roomId: string,
    public readonly type: string,
    public readonly resourceId: string,
    public readonly participants: RoomParticipantDto[],
    public readonly lastActivityAt: Date,
    public readonly metadata?: Record<string, any>,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  public toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      roomId: this.roomId,
      type: this.type,
      resourceId: this.resourceId,
      participants: this.participants,
      lastActivityAt: this.lastActivityAt,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
