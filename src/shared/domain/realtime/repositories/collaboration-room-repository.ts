import { CollaborationRoom } from '../entities/collaboration-room';
import { RoomId } from '../value-objects/room-id';
import { RoomTypeValueObject, RoomType } from '../value-objects/room-type';

export interface CollaborationRoomSearchCriteria {
  type?: RoomType;
  resourceId?: string;
  participantUserId?: string;
  isEmpty?: boolean;
  createdAtBefore?: Date;
  createdAtAfter?: Date;
  lastActivityBefore?: Date;
  lastActivityAfter?: Date;
}

export interface ICollaborationRoomRepository {
  /**
   * Save a collaboration room
   */
  save(room: CollaborationRoom): Promise<void>;

  /**
   * Find collaboration room by room ID
   */
  findByRoomId(roomId: RoomId): Promise<CollaborationRoom | null>;

  /**
   * Find collaboration room by type and resource ID
   */
  findByTypeAndResourceId(type: RoomType, resourceId: string): Promise<CollaborationRoom | null>;

  /**
   * Find collaboration rooms by type
   */
  findByType(type: RoomType): Promise<CollaborationRoom[]>;

  /**
   * Find collaboration rooms by resource ID
   */
  findByResourceId(resourceId: string): Promise<CollaborationRoom[]>;

  /**
   * Find collaboration rooms by participant user ID
   */
  findByParticipantUserId(userId: string): Promise<CollaborationRoom[]>;

  /**
   * Find empty rooms
   */
  findEmptyRooms(): Promise<CollaborationRoom[]>;

  /**
   * Search collaboration rooms with criteria
   */
  search(criteria: CollaborationRoomSearchCriteria): Promise<CollaborationRoom[]>;

  /**
   * Delete collaboration room
   */
  delete(roomId: RoomId): Promise<void>;

  /**
   * Delete collaboration rooms by type
   */
  deleteByType(type: RoomType): Promise<void>;

  /**
   * Delete collaboration rooms by resource ID
   */
  deleteByResourceId(resourceId: string): Promise<void>;

  /**
   * Check if collaboration room exists
   */
  exists(roomId: RoomId): Promise<boolean>;

  /**
   * Check if room exists by type and resource ID
   */
  existsByTypeAndResourceId(type: RoomType, resourceId: string): Promise<boolean>;

  /**
   * Count collaboration rooms by criteria
   */
  count(criteria: CollaborationRoomSearchCriteria): Promise<number>;

  /**
   * Get active rooms count
   */
  getActiveRoomsCount(): Promise<number>;

  /**
   * Get active rooms count by type
   */
  getActiveRoomsCountByType(type: RoomType): Promise<number>;

  /**
   * Clean up old inactive rooms
   */
  cleanupOldRooms(olderThan: Date): Promise<number>;

  /**
   * Update room metadata
   */
  updateMetadata(roomId: RoomId, metadata: Record<string, any>): Promise<void>;

  /**
   * Update room activity
   */
  updateActivity(roomId: RoomId): Promise<void>;
}
