import { SSENotificationStreamingService, NotificationStreamClient, NotificationStreamEvent } from '../../../../../slices/notifications/infrastructure/services/sse-notification-streaming-service';
import { Notification, NotificationCategory, NotificationPriority } from '../../../../../shared/domain/notifications/entities/notification';
import { NotificationId } from '../../../../../shared/domain/notifications/value-objects/notification-id';
import { UserId } from '../../../../../shared/domain/users/value-objects/user-id';
import { OrganizationId } from '../../../../../shared/domain/organizations/value-objects/organization-id';

// Mock global Response and ReadableStream
global.Response = jest.fn().mockImplementation((body, init) => ({
  body,
  ...init,
}));

global.ReadableStream = jest.fn().mockImplementation(({ start, cancel }) => ({
  start,
  cancel,
  getReader: jest.fn(),
}));

// Mock timers
jest.useFakeTimers();

describe('SSENotificationStreamingService', () => {
  let service: SSENotificationStreamingService;
  let mockController: any;
  let mockNotification: Notification;

  beforeEach(() => {
    service = new SSENotificationStreamingService();
    
    // Mock ReadableStreamDefaultController
    mockController = {
      enqueue: jest.fn(),
      close: jest.fn(),
      error: jest.fn(),
    };

    // Create mock notification
    mockNotification = Notification.create(
      NotificationId.create('notification-123'),
      UserId.create('user-123'),
      OrganizationId.create('org-123'),
      'Test Notification',
      'This is a test notification message',
      NotificationCategory.SYSTEM,
      NotificationPriority.MEDIUM,
      {
        actionUrl: '/test-action',
        metadata: { key: 'value' },
      }
    );

    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    service.shutdown();
    jest.clearAllTimers();
  });

  describe('createStream', () => {
    it('should create a new SSE stream for a user', () => {
      const response = service.createStream('user-123', 'org-123');

      expect(response).toBeDefined();
      expect(global.ReadableStream).toHaveBeenCalled();
      expect(service.getConnectedClientsCount()).toBe(1);
    });

    it('should create stream without organization ID', () => {
      const response = service.createStream('user-456');

      expect(response).toBeDefined();
      expect(service.getConnectedClientsCount()).toBe(1);
    });

    it('should send initial connection event', () => {
      // Mock ReadableStream to capture the start function
      const mockStart = jest.fn();
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        mockStart.mockImplementation(start);
        return { start: mockStart };
      });

      service.createStream('user-123', 'org-123');

      // Call the start function with our mock controller
      mockStart(mockController);

      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('data: {"message":"Connected to notification stream"}')
      );
    });

    it('should handle multiple streams for the same user', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-123', 'org-123');

      expect(service.getConnectedClientsCount()).toBe(2);
      expect(service.getUserClientsCount('user-123')).toBe(2);
    });

    it('should handle streams for different users', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');

      expect(service.getConnectedClientsCount()).toBe(2);
      expect(service.getUserClientsCount('user-123')).toBe(1);
      expect(service.getUserClientsCount('user-456')).toBe(1);
    });
  });

  describe('sendNotificationToUser', () => {
    beforeEach(() => {
      // Setup mock ReadableStream to capture controller
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });
    });

    it('should send notification to specific user', () => {
      service.createStream('user-123', 'org-123');
      
      service.sendNotificationToUser('user-123', mockNotification);

      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('event: notification')
      );
      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('"title":"Test Notification"')
      );
    });

    it('should not send notification to other users', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      
      jest.clearAllMocks();
      
      service.sendNotificationToUser('user-123', mockNotification);

      // Should only be called for user-123's stream
      expect(mockController.enqueue).toHaveBeenCalledTimes(3); // event, data, empty line
    });

    it('should handle sending to non-existent user', () => {
      expect(() => {
        service.sendNotificationToUser('non-existent-user', mockNotification);
      }).not.toThrow();
    });

    it('should send to multiple streams of the same user', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-123', 'org-123');
      
      jest.clearAllMocks();
      
      service.sendNotificationToUser('user-123', mockNotification);

      // Should be called for both streams (3 calls per stream)
      expect(mockController.enqueue).toHaveBeenCalledTimes(6);
    });
  });

  describe('sendNotificationToOrganization', () => {
    beforeEach(() => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });
    });

    it('should send notification to all users in organization', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-123');
      service.createStream('user-789', 'org-456'); // Different org
      
      jest.clearAllMocks();
      
      service.sendNotificationToOrganization('org-123', mockNotification);

      // Should be called for 2 users in org-123 (3 calls per stream)
      expect(mockController.enqueue).toHaveBeenCalledTimes(6);
    });

    it('should not send to users without organization', () => {
      service.createStream('user-123'); // No org
      service.createStream('user-456', 'org-123');
      
      jest.clearAllMocks();
      
      service.sendNotificationToOrganization('org-123', mockNotification);

      // Should only be called for user-456 (3 calls)
      expect(mockController.enqueue).toHaveBeenCalledTimes(3);
    });

    it('should handle sending to non-existent organization', () => {
      expect(() => {
        service.sendNotificationToOrganization('non-existent-org', mockNotification);
      }).not.toThrow();
    });
  });

  describe('broadcastNotification', () => {
    beforeEach(() => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });
    });

    it('should send notification to all connected clients', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      service.createStream('user-789');
      
      jest.clearAllMocks();
      
      service.broadcastNotification(mockNotification);

      // Should be called for all 3 clients (3 calls per stream)
      expect(mockController.enqueue).toHaveBeenCalledTimes(9);
    });

    it('should handle broadcast with no connected clients', () => {
      expect(() => {
        service.broadcastNotification(mockNotification);
      }).not.toThrow();
    });
  });

  describe('sendEventToUser', () => {
    beforeEach(() => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });
    });

    it('should send custom event to specific user', () => {
      service.createStream('user-123', 'org-123');
      
      const customEvent: NotificationStreamEvent = {
        type: 'ping',
        data: { timestamp: Date.now() },
        id: 'ping-123',
      };
      
      service.sendEventToUser('user-123', customEvent);

      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('event: ping')
      );
      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('id: ping-123')
      );
    });

    it('should handle error events', () => {
      service.createStream('user-123', 'org-123');
      
      const errorEvent: NotificationStreamEvent = {
        type: 'error',
        data: { message: 'Something went wrong' },
      };
      
      service.sendEventToUser('user-123', errorEvent);

      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('event: error')
      );
    });

    it('should handle events with retry parameter', () => {
      service.createStream('user-123', 'org-123');
      
      const retryEvent: NotificationStreamEvent = {
        type: 'notification',
        data: { message: 'Retry this' },
        retry: 5000,
      };
      
      service.sendEventToUser('user-123', retryEvent);

      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('retry: 5000')
      );
    });
  });

  describe('client management', () => {
    it('should track connected clients count', () => {
      expect(service.getConnectedClientsCount()).toBe(0);
      
      service.createStream('user-123', 'org-123');
      expect(service.getConnectedClientsCount()).toBe(1);
      
      service.createStream('user-456', 'org-456');
      expect(service.getConnectedClientsCount()).toBe(2);
    });

    it('should track user-specific client count', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      
      expect(service.getUserClientsCount('user-123')).toBe(2);
      expect(service.getUserClientsCount('user-456')).toBe(1);
      expect(service.getUserClientsCount('user-789')).toBe(0);
    });

    it('should get list of connected user IDs', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      service.createStream('user-123', 'org-123'); // Duplicate user
      
      const connectedUsers = service.getConnectedUserIds();
      
      expect(connectedUsers).toContain('user-123');
      expect(connectedUsers).toContain('user-456');
      expect(connectedUsers).toHaveLength(2); // Should be unique
    });

    it('should disconnect all streams for a user', () => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });

      service.createStream('user-123', 'org-123');
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      
      expect(service.getUserClientsCount('user-123')).toBe(2);
      
      service.disconnectUser('user-123');
      
      expect(service.getUserClientsCount('user-123')).toBe(0);
      expect(service.getUserClientsCount('user-456')).toBe(1);
      expect(mockController.close).toHaveBeenCalledTimes(2);
    });
  });

  describe('ping mechanism', () => {
    beforeEach(() => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });
    });

    it('should send ping events to all clients', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      
      jest.clearAllMocks();
      
      // Advance timers to trigger ping
      jest.advanceTimersByTime(30000);
      
      expect(mockController.enqueue).toHaveBeenCalledWith(
        expect.stringContaining('event: ping')
      );
    });

    it('should remove inactive clients', () => {
      service.createStream('user-123', 'org-123');
      
      expect(service.getConnectedClientsCount()).toBe(1);
      
      // Advance timers beyond client timeout
      jest.advanceTimersByTime(65000);
      
      expect(service.getConnectedClientsCount()).toBe(0);
    });

    it('should update last ping time for active clients', () => {
      service.createStream('user-123', 'org-123');
      
      // Advance time but not beyond timeout
      jest.advanceTimersByTime(30000);
      
      expect(service.getConnectedClientsCount()).toBe(1);
      
      // Advance more time
      jest.advanceTimersByTime(30000);
      
      expect(service.getConnectedClientsCount()).toBe(1);
    });
  });

  describe('shutdown', () => {
    beforeEach(() => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });
    });

    it('should close all client connections', () => {
      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      
      service.shutdown();
      
      expect(mockController.close).toHaveBeenCalledTimes(2);
      expect(service.getConnectedClientsCount()).toBe(0);
    });

    it('should clear ping interval', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      service.shutdown();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should handle shutdown with no clients', () => {
      expect(() => {
        service.shutdown();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle controller errors gracefully', () => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        const errorController = {
          enqueue: jest.fn().mockImplementation(() => {
            throw new Error('Controller error');
          }),
          close: jest.fn(),
          error: jest.fn(),
        };
        start(errorController);
        return {};
      });

      service.createStream('user-123', 'org-123');
      
      expect(() => {
        service.sendNotificationToUser('user-123', mockNotification);
      }).not.toThrow();
    });

    it('should handle malformed notification data', () => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });

      service.createStream('user-123', 'org-123');
      
      const malformedNotification = {
        id: null,
        title: undefined,
        message: 123, // Wrong type
      } as any;
      
      expect(() => {
        service.sendNotificationToUser('user-123', malformedNotification);
      }).not.toThrow();
    });

    it('should handle stream creation errors', () => {
      global.ReadableStream = jest.fn().mockImplementation(() => {
        throw new Error('Stream creation failed');
      });

      expect(() => {
        service.createStream('user-123', 'org-123');
      }).toThrow('Stream creation failed');
    });
  });

  describe('notification serialization', () => {
    beforeEach(() => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });
    });

    it('should serialize notification with all fields', () => {
      service.createStream('user-123', 'org-123');
      
      service.sendNotificationToUser('user-123', mockNotification);
      
      const enqueuedData = mockController.enqueue.mock.calls
        .find(call => call[0].includes('data:'))?.[0];
      
      expect(enqueuedData).toContain('"id":"notification-123"');
      expect(enqueuedData).toContain('"title":"Test Notification"');
      expect(enqueuedData).toContain('"message":"This is a test notification message"');
      expect(enqueuedData).toContain('"category":"SYSTEM"');
      expect(enqueuedData).toContain('"priority":"MEDIUM"');
    });

    it('should handle notifications with minimal data', () => {
      const minimalNotification = Notification.create(
        NotificationId.create('minimal-123'),
        UserId.create('user-123'),
        OrganizationId.create('org-123'),
        'Minimal Title',
        'Minimal message',
        NotificationCategory.USER,
        NotificationPriority.LOW
      );

      service.createStream('user-123', 'org-123');
      
      service.sendNotificationToUser('user-123', minimalNotification);
      
      const enqueuedData = mockController.enqueue.mock.calls
        .find(call => call[0].includes('data:'))?.[0];
      
      expect(enqueuedData).toContain('"title":"Minimal Title"');
      expect(enqueuedData).toContain('"category":"USER"');
      expect(enqueuedData).toContain('"priority":"LOW"');
    });
  });

  describe('memory management', () => {
    it('should handle large number of clients', () => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });

      // Create many clients
      for (let i = 0; i < 1000; i++) {
        service.createStream(`user-${i}`, `org-${i % 10}`);
      }
      
      expect(service.getConnectedClientsCount()).toBe(1000);
      
      // Broadcast should handle all clients
      expect(() => {
        service.broadcastNotification(mockNotification);
      }).not.toThrow();
    });

    it('should clean up disconnected clients', () => {
      global.ReadableStream = jest.fn().mockImplementation(({ start }) => {
        start(mockController);
        return {};
      });

      service.createStream('user-123', 'org-123');
      service.createStream('user-456', 'org-456');
      
      expect(service.getConnectedClientsCount()).toBe(2);
      
      // Simulate client timeout
      jest.advanceTimersByTime(65000);
      
      expect(service.getConnectedClientsCount()).toBe(0);
    });
  });
});