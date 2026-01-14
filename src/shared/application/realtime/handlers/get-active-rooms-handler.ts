import { injectable } from 'inversify';
import { QueryHandler } from '../../base/query-handler';
import { GetActiveRoomsQuery } from '../queries/get-active-rooms-query';
import { RoomManagementService } from '../../../domain/realtime/services/room-management-service';
import { Result } from '../../base/result';
import { CollaborationRoomDto } from '../dtos/collaboration-room-dto';

/**
 * Get Active Rooms Handler
 * Handles getting active collaboration rooms
 */
@injectable()
export class GetActiveRoomsHandler implements QueryHandler<GetActiveRoomsQuery, CollaborationRoomDto[]> {
  constructor(
    private readonly roomManagementService: RoomManagementService
  ) {}

  async handle(query: GetActiveRoomsQuery): Promise<Result<CollaborationRoomDto[]>> {
    try {
      query.validate();

      const rooms = query.type
        ? await this.roomManagementService.getRoomsByType(query.type)
        : await this.roomManagementService.getActiveRooms();

      const dtos = rooms.map(room => new CollaborationRoomDto(
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
      ));

      return Result.success(dtos);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
