import { injectable } from 'inversify';
import { CommandHandler } from '../../base/command-handler';
import { RegisterConnectionCommand } from '../commands/register-connection-command';
import { RealtimeService } from '../../../domain/realtime/services/realtime-service';
import { SocketId } from '../../../domain/realtime/value-objects/socket-id';
import { Result } from '../../base/result';
import { SocketConnectionDto } from '../dtos/socket-connection-dto';

/**
 * Register Connection Handler
 * Handles registering a new socket connection
 */
@injectable()
export class RegisterConnectionHandler implements CommandHandler<RegisterConnectionCommand, SocketConnectionDto> {
  constructor(
    private readonly realtimeService: RealtimeService
  ) {}

  async handle(command: RegisterConnectionCommand): Promise<Result<SocketConnectionDto>> {
    try {
      command.validate();

      const socketId = SocketId.create(command.socketId);
      const connectionInfo = {
        userId: command.userId,
        userName: command.userName,
        userEmail: command.userEmail,
        userAvatar: command.userAvatar,
        organizationId: command.organizationId
      };

      const connection = await this.realtimeService.registerConnection(connectionInfo, socketId);

      const dto = new SocketConnectionDto(
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

      return Result.success(dto);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
