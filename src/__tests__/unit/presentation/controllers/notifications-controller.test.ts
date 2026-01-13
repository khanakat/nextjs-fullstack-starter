import { NextRequest, NextResponse } from 'next/server';
import { NotificationsController } from 'src/slices/notifications/presentation/controllers/notifications-controller';
import { NotificationFactory } from '../../../factories/notification-factory';
import { UserFactory } from '../../../factories/user-factory';
import { ValueObjectFactory } from '../../../factories/value-object-factory';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let mockCreateNotificationUseCase: any;
  let mockGetNotificationsUseCase: any;
  let mockMarkAsReadUseCase: any;
  let mockDeleteNotificationUseCase: any;
  let mockLogger: any;

  beforeEach(() => {
    mockCreateNotificationUseCase = {
      execute: jest.fn(),
    };

    mockGetNotificationsUseCase = {
      execute: jest.fn(),
    };

    mockMarkAsReadUseCase = {
      execute: jest.fn(),
    };

    mockDeleteNotificationUseCase = {
      execute: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    controller = new NotificationsController(
      mockCreateNotificationUseCase,
      mockGetNotificationsUseCase,
      mockMarkAsReadUseCase,
      mockDeleteNotificationUseCase,
      mockLogger
    );
  });

  describe('POST /api/notifications', () => {
    it('should create notification successfully', async () => {
      const user = UserFactory.create();
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test message',
        recipientId: user.getId().getValue(),
        type: 'info',
        priority: 'medium',
      };

      const createdNotification = NotificationFactory.create(notificationData);

      mockCreateNotificationUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => createdNotification,
      });

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.getId().getValue(),
        },
      });

      const response = await controller.createNotification(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(createdNotification.getId().getValue());
      expect(responseData.data.title).toBe(notificationData.title);
      expect(mockCreateNotificationUseCase.execute).toHaveBeenCalledWith({
        title: notificationData.title,
        message: notificationData.message,
        recipientId: notificationData.recipientId,
        type: notificationData.type,
        priority: notificationData.priority,
      });
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        message: 'Test message',
        recipientId: 'invalid-id',
        type: 'invalid-type',
      };

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await controller.createNotification(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('validation');
    });

    it('should handle use case failures', async () => {
      const user = UserFactory.create();
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test message',
        recipientId: user.getId().getValue(),
        type: 'info',
        priority: 'medium',
      };

      mockCreateNotificationUseCase.execute.mockResolvedValue({
        isSuccess: false,
        getError: () => new Error('Recipient not found'),
      });

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.getId().getValue(),
        },
      });

      const response = await controller.createNotification(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Recipient not found');
    });

    it('should handle missing authentication', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test message',
        recipientId: 'user-123',
        type: 'info',
      };

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
        headers: {
          'Content-Type': 'application/json',
          // Missing x-user-id header
        },
      });

      const response = await controller.createNotification(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-123',
        },
      });

      const response = await controller.createNotification(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid JSON');
    });
  });

  describe('GET /api/notifications', () => {
    it('should get notifications with pagination', async () => {
      const user = UserFactory.create();
      const notifications = NotificationFactory.createMany(5, {
        recipientId: user.getId().getValue(),
      });

      const paginatedResult = {
        items: notifications,
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      };

      mockGetNotificationsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => paginatedResult,
      });

      const request = new NextRequest(
        'http://localhost/api/notifications?page=1&limit=10',
        {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.items).toHaveLength(5);
      expect(responseData.data.total).toBe(25);
      expect(responseData.data.page).toBe(1);
      expect(responseData.data.totalPages).toBe(3);
      expect(mockGetNotificationsUseCase.execute).toHaveBeenCalledWith({
        recipientId: user.getId().getValue(),
        page: 1,
        limit: 10,
      });
    });

    it('should filter notifications by type', async () => {
      const user = UserFactory.create();
      const notifications = NotificationFactory.createMany(3, {
        recipientId: user.getId().getValue(),
        type: 'info',
      });

      mockGetNotificationsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({
          items: notifications,
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      });

      const request = new NextRequest(
        'http://localhost/api/notifications?type=info',
        {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.items).toHaveLength(3);
      expect(mockGetNotificationsUseCase.execute).toHaveBeenCalledWith({
        recipientId: user.getId().getValue(),
        type: 'info',
        page: 1,
        limit: 10,
      });
    });

    it('should filter notifications by priority', async () => {
      const user = UserFactory.create();
      const notifications = NotificationFactory.createMany(2, {
        recipientId: user.getId().getValue(),
        priority: 'high',
      });

      mockGetNotificationsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({
          items: notifications,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      });

      const request = new NextRequest(
        'http://localhost/api/notifications?priority=high',
        {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.items).toHaveLength(2);
      expect(mockGetNotificationsUseCase.execute).toHaveBeenCalledWith({
        recipientId: user.getId().getValue(),
        priority: 'high',
        page: 1,
        limit: 10,
      });
    });

    it('should get only unread notifications', async () => {
      const user = UserFactory.create();
      const notifications = NotificationFactory.createMany(3, {
        recipientId: user.getId().getValue(),
      });

      mockGetNotificationsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({
          items: notifications,
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      });

      const request = new NextRequest(
        'http://localhost/api/notifications?unread=true',
        {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockGetNotificationsUseCase.execute).toHaveBeenCalledWith({
        recipientId: user.getId().getValue(),
        unread: true,
        page: 1,
        limit: 10,
      });
    });

    it('should handle invalid pagination parameters', async () => {
      const user = UserFactory.create();

      const request = new NextRequest(
        'http://localhost/api/notifications?page=0&limit=1000',
        {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('validation');
    });
  });

  describe('PUT /api/notifications/[id]/read', () => {
    it('should mark notification as read', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create({
        recipientId: user.getId().getValue(),
      });

      mockMarkAsReadUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => notification,
      });

      const request = new NextRequest(
        `http://localhost/api/notifications/${notification.getId().getValue()}/read`,
        {
          method: 'PUT',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.markAsRead(request, {
        params: { id: notification.getId().getValue() },
      });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockMarkAsReadUseCase.execute).toHaveBeenCalledWith({
        notificationId: notification.getId().getValue(),
        userId: user.getId().getValue(),
      });
    });

    it('should handle notification not found', async () => {
      const user = UserFactory.create();
      const notificationId = ValueObjectFactory.createUniqueId().getValue();

      mockMarkAsReadUseCase.execute.mockResolvedValue({
        isSuccess: false,
        getError: () => new Error('Notification not found'),
      });

      const request = new NextRequest(
        `http://localhost/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.markAsRead(request, {
        params: { id: notificationId },
      });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Notification not found');
    });

    it('should handle unauthorized access', async () => {
      const user = UserFactory.create();
      const otherUser = UserFactory.create();
      const notification = NotificationFactory.create({
        recipientId: otherUser.getId().getValue(),
      });

      mockMarkAsReadUseCase.execute.mockResolvedValue({
        isSuccess: false,
        getError: () => new Error('Access denied'),
      });

      const request = new NextRequest(
        `http://localhost/api/notifications/${notification.getId().getValue()}/read`,
        {
          method: 'PUT',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.markAsRead(request, {
        params: { id: notification.getId().getValue() },
      });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Access denied');
    });
  });

  describe('DELETE /api/notifications/[id]', () => {
    it('should delete notification successfully', async () => {
      const user = UserFactory.create();
      const notification = NotificationFactory.create({
        recipientId: user.getId().getValue(),
      });

      mockDeleteNotificationUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => true,
      });

      const request = new NextRequest(
        `http://localhost/api/notifications/${notification.getId().getValue()}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.deleteNotification(request, {
        params: { id: notification.getId().getValue() },
      });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockDeleteNotificationUseCase.execute).toHaveBeenCalledWith({
        notificationId: notification.getId().getValue(),
        userId: user.getId().getValue(),
      });
    });

    it('should handle notification not found for deletion', async () => {
      const user = UserFactory.create();
      const notificationId = ValueObjectFactory.createUniqueId().getValue();

      mockDeleteNotificationUseCase.execute.mockResolvedValue({
        isSuccess: false,
        getError: () => new Error('Notification not found'),
      });

      const request = new NextRequest(
        `http://localhost/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const response = await controller.deleteNotification(request, {
        params: { id: notificationId },
      });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Notification not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const user = UserFactory.create();

      mockGetNotificationsUseCase.execute.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'GET',
        headers: {
          'x-user-id': user.getId().getValue(),
        },
      });

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected error in NotificationsController',
        expect.objectContaining({
          error: 'Database connection failed',
        })
      );
    });

    it('should handle timeout errors', async () => {
      const user = UserFactory.create();

      mockGetNotificationsUseCase.execute.mockRejectedValue(
        new Error('Request timeout')
      );

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'GET',
        headers: {
          'x-user-id': user.getId().getValue(),
        },
      });

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Request Validation', () => {
    it('should validate required headers', async () => {
      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'GET',
        // Missing x-user-id header
      });

      const response = await controller.getNotifications(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should validate content type for POST requests', async () => {
      const user = UserFactory.create();

      const request = new NextRequest('http://localhost/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
        headers: {
          'x-user-id': user.getId().getValue(),
          // Missing Content-Type header
        },
      });

      const response = await controller.createNotification(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Content-Type');
    });
  });

  describe('Performance', () => {
    it('should handle large notification lists efficiently', async () => {
      const user = UserFactory.create();
      const notifications = NotificationFactory.createMany(100);

      mockGetNotificationsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({
          items: notifications,
          total: 1000,
          page: 1,
          limit: 100,
          totalPages: 10,
        }),
      });

      const request = new NextRequest(
        'http://localhost/api/notifications?limit=100',
        {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        }
      );

      const startTime = Date.now();
      const response = await controller.getNotifications(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent requests', async () => {
      const user = UserFactory.create();
      const notifications = NotificationFactory.createMany(5);

      mockGetNotificationsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({
          items: notifications,
          total: 5,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      });

      const requests = Array.from({ length: 10 }, () =>
        new NextRequest('http://localhost/api/notifications', {
          method: 'GET',
          headers: {
            'x-user-id': user.getId().getValue(),
          },
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => controller.getNotifications(req))
      );
      const endTime = Date.now();

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(endTime - startTime).toBeLessThan(2000); // Should handle concurrent requests efficiently
    });
  });
});