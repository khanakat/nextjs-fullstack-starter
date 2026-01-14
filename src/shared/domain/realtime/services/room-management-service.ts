import { injectable } from 'inversify';
import { CollaborationRoom } from '../entities/collaboration-room';
import type { ICollaborationRoomRepository } from '../repositories/collaboration-room-repository';
import { RoomId } from '../value-objects/room-id';
import { RoomType } from '../value-objects/room-type';

export interface RoomStatistics {
  totalRooms: number;
  activeRooms: number;
  emptyRooms: number;
  roomsByType: Record<RoomType, number>;
  totalParticipants: number;
}

export interface RoomInfo {
  roomId: string;
  type: RoomType;
  resourceId: string;
  participantCount: number;
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Room Management Service
 * Manages collaboration room lifecycle and statistics
 */
@injectable()
export class RoomManagementService {
  constructor(
    private readonly collaborationRoomRepository: ICollaborationRoomRepository
  ) {}

  /**
   * Get room information
   */
  public async getRoomInfo(roomId: RoomId): Promise<RoomInfo | null> {
    const room = await this.collaborationRoomRepository.findByRoomId(roomId);

    if (!room) {
      return null;
    }

    return {
      roomId: room.roomId.value,
      type: room.type.type,
      resourceId: room.resourceId,
      participantCount: room.getParticipantCount(),
      createdAt: room.createdAt,
      lastActivityAt: room.lastActivityAt,
    };
  }

  /**
   * Get all active rooms
   */
  public async getActiveRooms(): Promise<RoomInfo[]> {
    const rooms = await this.collaborationRoomRepository.search({});

    return rooms
      .filter(room => !room.isEmpty())
      .map(room => ({
        roomId: room.roomId.value,
        type: room.type.type,
        resourceId: room.resourceId,
        participantCount: room.getParticipantCount(),
        createdAt: room.createdAt,
        lastActivityAt: room.lastActivityAt,
      }));
  }

  /**
   * Get rooms by type
   */
  public async getRoomsByType(type: RoomType): Promise<RoomInfo[]> {
    const rooms = await this.collaborationRoomRepository.findByType(type);

    return rooms.map(room => ({
      roomId: room.roomId.value,
      type: room.type.type,
      resourceId: room.resourceId,
      participantCount: room.getParticipantCount(),
      createdAt: room.createdAt,
      lastActivityAt: room.lastActivityAt,
    }));
  }

  /**
   * Get room statistics
   */
  public async getRoomStatistics(): Promise<RoomStatistics> {
    const rooms = await this.collaborationRoomRepository.search({});

    const activeRooms = rooms.filter(room => !room.isEmpty());
    const emptyRooms = rooms.filter(room => room.isEmpty());

    const roomsByType: Record<RoomType, number> = {
      [RoomType.WORKFLOW]: 0,
      [RoomType.ANALYTICS]: 0,
      [RoomType.REPORT]: 0,
      [RoomType.INTEGRATION]: 0,
      [RoomType.DOCUMENT]: 0,
      [RoomType.DASHBOARD]: 0,
    };

    let totalParticipants = 0;

    for (const room of rooms) {
      roomsByType[room.type.type]++;
      totalParticipants += room.getParticipantCount();
    }

    return {
      totalRooms: rooms.length,
      activeRooms: activeRooms.length,
      emptyRooms: emptyRooms.length,
      roomsByType,
      totalParticipants,
    };
  }

  /**
   * Update room metadata
   */
  public async updateRoomMetadata(
    roomId: RoomId,
    metadata: Record<string, any>
  ): Promise<void> {
    await this.collaborationRoomRepository.updateMetadata(roomId, metadata);
  }

  /**
   * Update room activity
   */
  public async updateRoomActivity(roomId: RoomId): Promise<void> {
    await this.collaborationRoomRepository.updateActivity(roomId);
  }

  /**
   * Clean up old inactive rooms
   */
  public async cleanupOldRooms(olderThan: Date): Promise<number> {
    return await this.collaborationRoomRepository.cleanupOldRooms(olderThan);
  }

  /**
   * Check if room exists
   */
  public async roomExists(roomId: RoomId): Promise<boolean> {
    return await this.collaborationRoomRepository.exists(roomId);
  }

  /**
   * Check if room exists by type and resource ID
   */
  public async roomExistsByTypeAndResourceId(
    type: RoomType,
    resourceId: string
  ): Promise<boolean> {
    return await this.collaborationRoomRepository.existsByTypeAndResourceId(
      type,
      resourceId
    );
  }
}
