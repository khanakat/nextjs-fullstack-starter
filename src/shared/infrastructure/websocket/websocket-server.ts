import { Server } from 'socket.io';
import { IEventBus } from '../events';
import { DIContainer } from '../di/container';
import { TYPES } from '../di/types';
import { DomainEvent } from '../../domain/base/domain-event';

/**
 * WebSocket Server for real-time communication
 * Integrates with EventBus for domain event publishing
 */
export class WebSocketServer {
  private io: Server;
  private eventBus: IEventBus;
  private connectedClients = new Map<string, Set<string>>();

  constructor() {
    this.io = new Server({
      cors: {
        origin: process.env.WEBSOCKET_CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      path: '/ws',
    });
    
    this.eventBus = DIContainer.get<IEventBus>(TYPES.EventBus);
  }

  async start(port: number = 3001): Promise<void> {
    return new Promise<void>((resolve) => {
      const server = this.io.listen(port);
      console.log(`WebSocket server listening on port ${port}`);
      
      // Setup event bus integration
      this.setupEventBusIntegration();
      
      resolve();
    });
  }

  async stop(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.io.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }

  /**
   * Setup event bus integration
   * Publishes domain events to WebSocket clients
   */
  private setupEventBusIntegration(): void {
    // Subscribe to domain events and forward to WebSocket clients
    this.eventBus.subscribeAll(async (event: DomainEvent) => {
      const eventData = event.getEventData();
      const eventName = event.getEventName();
      
      // Broadcast to all connected clients
      for (const clientId of this.connectedClients.keys()) {
        this.io.to(clientId).emit(eventName, eventData);
      }
    });

    console.log(`Event bus integration setup complete`);
  }

  /**
   * Get connected clients count
   */
  getClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Broadcast to all clients
   */
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Send to specific client
   */
  sendToClient(clientId: string, event: string, data: any): void {
    this.io.to(clientId).emit(event, data);
  }

  /**
   * Handle client connection
   */
  private handleConnection(): void {
    const socket = this.io;
    
    socket.on('connection', (client) => {
      const clientId = client.id;
      this.connectedClients.set(clientId, new Set([clientId]));
      console.log(`Client connected: ${clientId}`);
      
      // Send initial connection event
      this.io.to(clientId).emit('connected', {
        clientId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      // Note: client.id is not available here, we need to track it differently
      console.log(`Client disconnected, reason: ${reason}`);
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(): void {
    const socket = this.io;
    
    socket.on('message', async (data) => {
      // Publish to event bus
      try {
        await this.eventBus.publish({
          getEventName: () => 'client_message',
          occurredOn: new Date(),
          eventVersion: 1,
        } as any);
      } catch (error) {
        console.error('Error publishing event:', error);
      }
    });
  }
}

// Export singleton instance
export const webSocketServer = new WebSocketServer();
