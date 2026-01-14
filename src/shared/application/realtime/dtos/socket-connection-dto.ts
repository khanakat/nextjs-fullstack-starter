import { Dto } from '../../base/dto';

/**
 * Socket Connection DTO
 */
export class SocketConnectionDto extends Dto {
  constructor(
    id: string,
    createdAt: Date,
    public readonly socketId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly userEmail: string,
    public readonly userAvatar?: string,
    public readonly organizationId: string,
    public readonly status: string,
    public readonly currentRoom?: string,
    public readonly lastActivityAt: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  public toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      socketId: this.socketId,
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      userAvatar: this.userAvatar,
      organizationId: this.organizationId,
      status: this.status,
      currentRoom: this.currentRoom,
      lastActivityAt: this.lastActivityAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
