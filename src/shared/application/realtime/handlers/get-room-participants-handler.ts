import { injectable } from 'inversify';
import { QueryHandler } from '../../base/query-handler';
import { GetRoomParticipantsQuery } from '../queries/get-room-participants-query';
import { RealtimeService } from '../../../domain/realtime/services/realtime-service';
import { RoomId } from '../../../domain/realtime/value-objects/room-id';
import { Result } from '../../base/result';
import { RoomParticipantDto } from '../dtos/collaboration-room-dto';

/**
 * Get Room Participants Handler
 * Handles getting participants in a room
 */
@injectable()
export class GetRoomParticipantsHandler implements QueryHandler<GetRoomParticipantsQuery, RoomParticipantDto[]> {
  constructor(
    private readonly realtimeService: RealtimeService
  ) {}

  async handle(query: GetRoomParticipantsQuery): Promise<Result<RoomParticipantDto[]>> {
    try {
      query.validate();

      const roomId = RoomId.create(query.roomId);
      const participants = await this.realtimeService.getRoomParticipants(roomId);

      const dtos = participants.map(p => ({
        userId: p.userId,
        userName: p.userName,
        userEmail: p.userEmail,
        userAvatar: p.userAvatar,
        socketId: p.socketId,
        joinedAt: p.joinedAt,
      }));

      return Result.success(dtos);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
