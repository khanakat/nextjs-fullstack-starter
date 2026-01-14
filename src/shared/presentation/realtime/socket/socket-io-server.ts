import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { injectable, inject } from 'inversify';
import { SocketIoIntegrationService } from '../../../infrastructure/realtime/socket/socket-io-integration';
import { RealtimeConnectionInfo } from '../../../domain/realtime/services/realtime-service';
import { RoomType } from '../../../domain/realtime/value-objects/room-type';

/**
 * Socket.IO Server
 * Manages WebSocket connections and room collaboration
 */
@injectable()
export class SocketIOServer {
  private io: SocketIOServer | null = null;
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds

  constructor(
    @inject('SocketIoIntegrationService') private readonly socketIoIntegrationService: SocketIoIntegrationService
  ) {}

  /**
   * Initialize Socket.IO server
   */
  public initialize(httpServer: HTTPServer): void {
    if (this.io) {
      console.warn('Socket.IO server already initialized');
      return;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: this.CONNECTION_TIMEOUT,
      pingInterval: 10000,
    });

    this.setupEventHandlers();
    console.log('Socket.IO server initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) {
      return;
    }

    this.io.on('connection', async (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle connection registration
      socket.on('register', async (data: {
        userId: string;
        userName: string;
        userEmail: string;
        userAvatar?: string;
        organizationId: string;
      }) => {
        try {
          const connectionInfo: RealtimeConnectionInfo = {
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            userAvatar: data.userAvatar,
            organizationId: data.organizationId,
          };

          await this.socketIoIntegrationService.handleConnection(socket.id, connectionInfo);
          socket.emit('registered', { success: true, socketId: socket.id });
        } catch (error) {
          console.error('Error registering connection:', error);
          socket.emit('error', { message: 'Failed to register connection' });
        }
      });

      // Handle room join
      socket.on('join-room', async (data: {
        type: RoomType;
        resourceId: string;
      }) => {
        try {
          const result = await this.socketIoIntegrationService.handleRoomJoin(
            socket.id,
            data.type,
            data.resourceId
          );

          if (result.success) {
            const room = result.room;
            if (room) {
              // Join the Socket.IO room
              socket.join(room.roomId.value);

              // Notify others in the room
              socket.to(room.roomId.value).emit('user-joined', {
                roomId: room.roomId.value,
                user: room.getParticipants().find(p => p.socketId === socket.id),
              });

              socket.emit('room-joined', {
                roomId: room.roomId.value,
                participants: room.getParticipants(),
              });
            }
          } else {
            socket.emit('error', { message: result.error || 'Failed to join room' });
          }
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Handle room leave
      socket.on('leave-room', async () => {
        try {
          const connection = this.socketIoIntegrationService.getConnection(socket.id);
          const roomId = connection?.currentRoom?.value;

          await this.socketIoIntegrationService.handleRoomLeave(socket.id);

          if (roomId) {
            // Leave the Socket.IO room
            socket.leave(roomId);

            // Notify others in the room
            socket.to(roomId).emit('user-left', {
              roomId,
              socketId: socket.id,
            });

            socket.emit('room-left', { roomId });
          }
        } catch (error) {
          console.error('Error leaving room:', error);
          socket.emit('error', { message: 'Failed to leave room' });
        }
      });

      // Handle activity updates
      socket.on('activity', async () => {
        try {
          await this.socketIoIntegrationService.handleActivityUpdate(socket.id);
        } catch (error) {
          console.error('Error updating activity:', error);
        }
      });

      // Handle custom events for room communication
      socket.on('room-message', (data: { roomId: string; message: any }) => {
        socket.to(data.roomId).emit('room-message', {
          ...data,
          senderSocketId: socket.id,
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        try {
          const connection = this.socketIoIntegrationService.getConnection(socket.id);
          const roomId = connection?.currentRoom?.value;

          await this.socketIoIntegrationService.handleDisconnection(socket.id);

          if (roomId) {
            // Notify others in the room
            socket.to(roomId).emit('user-left', {
              roomId,
              socketId: socket.id,
            });
          }
        } catch (error) {
          console.error('Error handling disconnection:', error);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Get Socket.IO server instance
   */
  public getServer(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * Broadcast message to a specific room
   */
  public broadcastToRoom(roomId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }

  /**
   * Send message to a specific socket
   */
  public sendToSocket(socketId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Get connected sockets count
   */
  public getConnectedCount(): number {
    return this.io ? this.io.sockets.sockets.size : 0;
  }

  /**
   * Get rooms count
   */
  public getRoomsCount(): number {
    return this.io ? this.io.sockets.adapter.rooms.size : 0;
  }

  /**
   * Close Socket.IO server
   */
  public close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
      console.log('Socket.IO server closed');
    }
  }
}
