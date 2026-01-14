import { Query } from '../../base/query';
import { RoomType } from '../../../domain/realtime/value-objects/room-type';

/**
 * Get Active Rooms Query
 * Query to get active collaboration rooms
 */
export class GetActiveRoomsQuery extends Query {
  constructor(
    public readonly type?: RoomType,
    userId?: string
  ) {
    super(userId);
  }

  public validate(): void {
    // No validation required
  }
}
