import { injectable } from 'inversify';
import { RealtimeService, RealtimeConnectionInfo } from '../../../domain/realtime/services/realtime-service';
import { RoomManagementService } from '../../../domain/realtime/services/room-management-service';
import { SocketId } from '../../../domain/realtime/value-objects/socket-id';
import { RoomType } from '../../../domain/realtime/value-objects/room-type';
import { SocketConnection } from '../../../domain/realtime/entities/socket-connection';
import { CollaborationRoom, RoomParticipant } from '../../../domain/realtime/entities/collaboration-room';
import { SocketConnectionDto } from '../../../application/realtime/dtos/socket-connection-dto';
import { CollaborationRoomDto } from '../../../application/realtime/dtos/collaboration-room-dto';

/**
 * Socket.IO Integration Service
 * Integrates Socket.IO with clean architecture services
 */
@injectable()
export class SocketIoIntegrationService {
  private connectionMap: Map<string, SocketConnection> = new Map();
  private roomMap: Map<string, CollaborationRoom> = new Map();

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly roomManagementService: RoomManagementService
  ) {}

  /**
   * Handle socket connection
   */
  public async handleConnection(
    socketId: string,
    connectionInfo: RealtimeConnectionInfo
  ): Promise<SocketConnection> {
    const socketIdVo = SocketId.create(socketId);
    const connection = await this.realtimeService.registerConnection(
      connectionInfo,
      socketIdVo
    );

    this.connectionMap.set(socketId, connection);
    return connection;
  }

  /**
   * Handle socket disconnection
   */
  public async handleDisconnection(socketId: string): Promise<void> {
    const socketIdVo = SocketId.create(socketId);
    await this.realtimeService.unregisterConnection(socketIdVo);
    this.connectionMap.delete(socketId);
  }

  /**
   * Handle room join
   */
  public async handleRoomJoin(
    socketId: string,
    type: RoomType,
    resourceId: string
  ): Promise<any> {
    const socketIdVo = SocketId.create(socketId);
    const result = await this.realtimeService.joinRoom(
      socketIdVo,
      type,
      resourceId
    );

    if (result.success && result.room) {
      this.roomMap.set(result.room.roomId.value, result.room);
    }

    return result;
  }

  /**
   * Handle room leave
   */
  public async handleRoomLeave(socketId: string): Promise<void> {
    const socketIdVo = SocketId.create(socketId);
    await this.realtimeService.leaveRoom(socketIdVo);

    // Clean up empty rooms from local map
    for (const [roomId, room] of this.roomMap.entries()) {
      if (room.isEmpty()) {
        this.roomMap.delete(roomId);
      }
    }
  }

  /**
   * Handle activity update
   */
  public async handleActivityUpdate(socketId: string): Promise<void> {
    const socketIdVo = SocketId.create(socketId);
    await this.realtimeService.updateActivity(socketIdVo);
  }

  /**
   * Get room participants
   */
  public async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
    const { RoomId } = await import('../../../domain/realtime/value-objects/room-id');
    const roomIdVo = RoomId.create(roomId);
    return await this.realtimeService.getRoomParticipants(roomIdVo);
  }

  /**
   * Get active rooms
   */
  public async getActiveRooms(type?: RoomType): Promise<CollaborationRoomDto[]> {
    const rooms = type
      ? await this.roomManagementService.getRoomsByType(type)
      : await this.roomManagementService.getActiveRooms();

    return rooms.map(room => this.mapToDto(room));
  }

  /**
   * Get room statistics
   */
  public async getRoomStatistics(): Promise<any> {
    return await this.roomManagementService.getRoomStatistics();
  }

  /**
   * Map domain entity to DTO
   */
  private mapToDto(room: CollaborationRoom): CollaborationRoomDto {
    return new CollaborationRoomDto(
      room.roomId.value,
      room.createdAt,
      room.roomId.value,
      room.type.type,
      room.resourceId,
      room.getParticipants().map(p => ({
        userId: p.userId,
        userName: p.userName,
        userEmail: p.userEmail,
        userAvatar: p.userAvatar,
        socketId: p.socketId,
        joinedAt: p.joinedAt,
      })),
      room.lastActivityAt,
      room.metadata
    );
  }

  /**
   * Map domain entity to DTO
   */
  private mapConnectionToDto(connection: SocketConnection): SocketConnectionDto {
    return new SocketConnectionDto(
      connection.socketId.value,
      connection.connectedAt,
      connection.socketId.value,
      connection.userId,
      connection.userName,
      connection.userEmail,
      connection.userAvatar,
      connection.organizationId,
      connection.status.status,
      connection.currentRoom?.value,
      connection.lastActivityAt
    );
  }

  /**
   * Get connection by socket ID
   */
  public getConnection(socketId: string): SocketConnection | undefined {
    return this.connectionMap.get(socketId);
  }

  /**
   * Get room by room ID
   */
  public getRoom(roomId: string): CollaborationRoom | undefined {
    return this.roomMap.get(roomId);
  }

  /**
   * Get all connections
   */
  public getAllConnections(): SocketConnection[] {
    return Array.from(this.connectionMap.values());
  }

  /**
   * Get all rooms
   */
  public getAllRooms(): CollaborationRoom[] {
    return Array.from(this.roomMap.values());
  }
}
