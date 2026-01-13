import { injectable } from 'inversify';
import { EventEmitter } from 'events';
import { Notification } from '../../../../shared/domain/notifications/entities/notification';

export interface NotificationStreamClient {
  id: string;
  userId: string;
  organizationId?: string;
  response: Response;
  controller: ReadableStreamDefaultController;
  lastPing: Date;
}

export interface NotificationStreamEvent {
  type: 'notification' | 'ping' | 'error' | 'close';
  data?: any;
  id?: string;
  retry?: number;
}

@injectable()
export class SSENotificationStreamingService extends EventEmitter {
  private clients = new Map<string, NotificationStreamClient>();
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly CLIENT_TIMEOUT = 60000; // 60 seconds

  constructor() {
    super();
    this.startPingInterval();
  }

  /**
   * Create a new SSE stream for a user
   */
  createStream(
    userId: string,
    organizationId?: string,
    request?: Request
  ): Response {
    const clientId = this.generateClientId();
    
    const stream = new ReadableStream({
      start: (controller) => {
        // Send initial connection event
        this.sendEvent(controller, {
          type: 'notification',
          data: { message: 'Connected to notification stream' },
          id: Date.now().toString()
        });

        // Store client
        const client: NotificationStreamClient = {
          id: clientId,
          userId,
          organizationId,
          response: new Response(), // This will be replaced by the actual response
          controller,
          lastPing: new Date()
        };

        this.clients.set(clientId, client);

        // Handle client disconnect
        request?.signal?.addEventListener('abort', () => {
          this.removeClient(clientId);
        });

        this.emit('clientConnected', { clientId, userId, organizationId });
      },
      cancel: () => {
        this.removeClient(clientId);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: Notification): void {
    const userClients = Array.from(this.clients.values())
      .filter(client => client.userId === userId);

    const eventData = {
      type: 'notification' as const,
      data: this.serializeNotification(notification),
      id: notification.id.id
    };

    userClients.forEach(client => {
      this.sendEvent(client.controller, eventData);
    });

    this.emit('notificationSent', { userId, notificationId: notification.id.value, clientCount: userClients.length });
  }

  /**
   * Send notification to all users in organization
   */
  sendNotificationToOrganization(organizationId: string, notification: Notification): void {
    const orgClients = Array.from(this.clients.values())
      .filter(client => client.organizationId === organizationId);

    const eventData = {
      type: 'notification' as const,
      data: this.serializeNotification(notification),
      id: notification.id.id
    };

    orgClients.forEach(client => {
      this.sendEvent(client.controller, eventData);
    });

    this.emit('notificationSent', { organizationId, notificationId: notification.id.id, clientCount: orgClients.length });
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcastNotification(notification: Notification): void {
    const eventData = {
      type: 'notification' as const,
      data: this.serializeNotification(notification),
      id: notification.id.id
    };

    this.clients.forEach(client => {
      this.sendEvent(client.controller, eventData);
    });

    this.emit('notificationBroadcast', { notificationId: notification.id.value, clientCount: this.clients.size });
  }

  /**
   * Send custom event to user
   */
  sendEventToUser(userId: string, event: NotificationStreamEvent): void {
    const userClients = Array.from(this.clients.values())
      .filter(client => client.userId === userId);

    userClients.forEach(client => {
      this.sendEvent(client.controller, event);
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get connected clients for user
   */
  getUserClientsCount(userId: string): number {
    return Array.from(this.clients.values())
      .filter(client => client.userId === userId).length;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds(): string[] {
    const userIds = new Set<string>();
    this.clients.forEach(client => {
      userIds.add(client.userId);
    });
    return Array.from(userIds);
  }

  /**
   * Disconnect user sessions
   */
  disconnectUser(userId: string): void {
    const userClients = Array.from(this.clients.entries())
      .filter(([_, client]) => client.userId === userId);

    userClients.forEach(([clientId, client]) => {
      this.sendEvent(client.controller, {
        type: 'close',
        data: { reason: 'User disconnected' }
      });
      this.removeClient(clientId);
    });
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all client connections
    this.clients.forEach((client, clientId) => {
      this.sendEvent(client.controller, {
        type: 'close',
        data: { reason: 'Server shutdown' }
      });
      this.removeClient(clientId);
    });

    this.emit('shutdown');
  }

  private sendEvent(controller: ReadableStreamDefaultController, event: NotificationStreamEvent): void {
    try {
      let message = '';
      
      if (event.id) {
        message += `id: ${event.id}\n`;
      }
      
      if (event.type) {
        message += `event: ${event.type}\n`;
      }
      
      if (event.data) {
        const dataStr = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        message += `data: ${dataStr}\n`;
      }
      
      if (event.retry) {
        message += `retry: ${event.retry}\n`;
      }
      
      message += '\n';

      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(message));
    } catch (error) {
      console.error('Error sending SSE event:', error);
      // Don't throw here to avoid breaking the stream
    }
  }

  private removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.controller.close();
      } catch (error) {
        // Controller might already be closed
      }
      this.clients.delete(clientId);
      this.emit('clientDisconnected', { clientId, userId: client.userId });
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private serializeNotification(notification: Notification): any {
    return {
      id: notification.id.value,
      userId: notification.userId.value,
      organizationId: notification.organizationId?.value,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      status: notification.status,
      channels: notification.channels.map(channel => ({
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config
      })),
      metadata: notification.metadata,
      actionUrl: notification.actionUrl,
      scheduledAt: notification.scheduledAt?.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
      readAt: notification.readAt?.toISOString(),
      archivedAt: notification.archivedAt?.toISOString(),
      createdAt: notification.createdAt.toISOString()
    };
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = new Date();
      const clientsToRemove: string[] = [];

      this.clients.forEach((client, clientId) => {
        const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
        
        if (timeSinceLastPing > this.CLIENT_TIMEOUT) {
          // Client timed out
          clientsToRemove.push(clientId);
        } else {
          // Send ping
          try {
            this.sendEvent(client.controller, {
              type: 'ping',
              data: { timestamp: now.toISOString() }
            });
            client.lastPing = now;
          } catch (error) {
            // Client connection broken
            clientsToRemove.push(clientId);
          }
        }
      });

      // Remove timed out or broken clients
      clientsToRemove.forEach(clientId => {
        this.removeClient(clientId);
      });
    }, this.PING_INTERVAL);
  }
}