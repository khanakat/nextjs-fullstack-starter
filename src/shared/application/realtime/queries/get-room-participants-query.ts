import { Query } from '../../base/query';

/**
 * Get Room Participants Query
 * Query to get participants in a room
 */
export class GetRoomParticipantsQuery extends Query {
  constructor(
    public readonly roomId: string,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    if (!this.roomId) {
      throw new Error('Room ID is required');
    }
  }
}
