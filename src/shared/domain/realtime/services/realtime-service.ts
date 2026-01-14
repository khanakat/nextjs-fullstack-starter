import { injectable } from 'inversify';
import { SocketConnection } from '../entities/socket-connection';
import type { ISocketConnectionRepository } from '../repositories/socket-connection-repository';
import type { ICollaborationRoomRepository } from '../repositories/collaboration-room-repository';
import { SocketId } from '../value-objects/socket-id';
import { RoomId } from '../value-objects/room-id';
import { RoomType } from '../value-objects/room-type';

export interface RealtimeConnectionInfo {
  socketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  organizationId: string;
}

export interface RoomJoinResult {
  success: boolean;
  room?: CollaborationRoom;
  error?: string;
}

export type CollaborationRoom = any; // Will be replaced with actual import

/**
 * Realtime Service
 * Manages real-time socket connections and room operations
 */
@injectable()
export class RealtimeService {
  constructor(
    private readonly socketConnectionRepository: ISocketConnectionRepository,
    private readonly collaborationRoomRepository: ICollaborationRoomRepository
  ) {}

  /**
   * Register a new socket connection
   */
  public async registerConnection(
    connectionInfo: RealtimeConnectionInfo,
    socketId: SocketId
  ): Promise<SocketConnection> {
    const connection = SocketConnection.create({
      socketId,
      userId: connectionInfo.userId,
      userName: connectionInfo.userName,
      userEmail: connectionInfo.userEmail,
      userAvatar: connectionInfo.userAvatar,
      organizationId: connectionInfo.organizationId,
    });

    await this.socketConnectionRepository.save(connection);
    return connection;
  }

  /**
   * Unregister a socket connection
   */
  public async unregisterConnection(socketId: SocketId): Promise<void> {
    const connection = await this.socketConnectionRepository.findBySocketId(socketId);

    if (connection) {
      connection.disconnect();
      await this.socketConnectionRepository.save(connection);

      // Clean up empty rooms
      if (connection.currentRoom) {
        await this.cleanupRoomIfEmpty(connection.currentRoom);
      }
    }
  }

  /**
   * Join a collaboration room
   */
  public async joinRoom(
    socketId: SocketId,
    type: RoomType,
    resourceId: string
  ): Promise<RoomJoinResult> {
    const connection = await this.socketConnectionRepository.findBySocketId(socketId);

    if (!connection) {
      return {
        success: false,
        error: 'Connection not found',
      };
    }

    const roomId = RoomId.generate(type, resourceId);
    let room = await this.collaborationRoomRepository.findByRoomId(roomId);

    if (!room) {
      room = await this.createRoom(type, resourceId);
    }

    // Add participant to room
    const participant = {
      userId: connection.userId,
      userName: connection.userName,
      userEmail: connection.userEmail,
      userAvatar: connection.userAvatar,
      socketId: socketId.value,
      joinedAt: new Date(),
    };

    (room as any).addParticipant(participant);
    await this.collaborationRoomRepository.save(room as any);

    // Update connection to reflect current room
    connection.joinRoom(roomId);
    await this.socketConnectionRepository.save(connection);

    return {
      success: true,
      room: room as any,
    };
  }

  /**
   * Leave a collaboration room
   */
  public async leaveRoom(socketId: SocketId): Promise<void> {
    const connection = await this.socketConnectionRepository.findBySocketId(socketId);

    if (connection && connection.currentRoom) {
      const roomId = connection.currentRoom;
      const room = await this.collaborationRoomRepository.findByRoomId(roomId);

      if (room) {
        (room as any).removeParticipant(socketId.value);
        await this.collaborationRoomRepository.save(room as any);

        // Clean up empty rooms
        await this.cleanupRoomIfEmpty(roomId);
      }

      connection.leaveRoom();
      await this.socketConnectionRepository.save(connection);
    }
  }

  /**
   * Update connection activity
   */
  public async updateActivity(socketId: SocketId): Promise<void> {
    await this.socketConnectionRepository.updateActivity(socketId);
  }

  /**
   * Get active connections for a user
   */
  public async getUserConnections(userId: string): Promise<SocketConnection[]> {
    return await this.socketConnectionRepository.findActiveByUserId(userId);
  }

  /**
   * Get room participants
   */
  public async getRoomParticipants(roomId: RoomId): Promise<any[]> {
    const room = await this.collaborationRoomRepository.findByRoomId(roomId);

    if (!room) {
      return [];
    }

    return (room as any).getParticipants();
  }

  /**
   * Get active connections count
   */
  public async getActiveConnectionsCount(): Promise<number> {
    return await this.socketConnectionRepository.getActiveConnectionsCount();
  }

  /**
   * Get active rooms count
   */
  public async getActiveRoomsCount(): Promise<number> {
    return await this.collaborationRoomRepository.getActiveRoomsCount();
  }

  /**
   * Create a new collaboration room
   */
  private async createRoom(
    type: RoomType,
    resourceId: string
  ): Promise<any> {
    // Import here to avoid circular dependency
    const { CollaborationRoom } = await import('../entities/collaboration-room');

    const room = CollaborationRoom.create({
      type,
      resourceId,
    });

    await this.collaborationRoomRepository.save(room);
    return room;
  }

  /**
   * Clean up room if it's empty
   */
  private async cleanupRoomIfEmpty(roomId: RoomId): Promise<void> {
    const room = await this.collaborationRoomRepository.findByRoomId(roomId);

    if (room && (room as any).isEmpty()) {
      (room as any).destroy();
      await this.collaborationRoomRepository.save(room as any);
      await this.collaborationRoomRepository.delete(roomId);
    }
  }
}
