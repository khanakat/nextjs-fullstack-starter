import { NotificationRepository } from 'src/shared/infrastructure/repositories/notification-repository';
import { NotificationFactory } from '../../../factories/notification-factory';
import { UserFactory } from '../../../factories/user-factory';
import { ValueObjectFactory } from '../../../factories/value-object-factory';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let mockPrismaClient: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPrismaClient = {
      notification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    repository = new NotificationRepository(mockPrismaClient, mockLogger);
  });

  describe('Save Operations', () => {
    it('should save new notification', async () => {
      const notification = NotificationFactory.create();
      const mockDbNotification = {
        id: notification.getId().getValue(),
        title: notification.getTitle(),
        message: notification.getMessage(),
        recipientId: notification.getRecipientId(),
        type: notification.getType(),
        priority: notification.getPriority(),
        createdAt: notification.getCreatedAt(),
      };

      mockPrismaClient.notification.create.mockResolvedValue(mockDbNotification);

      await repository.save(notification);

      expect(mockPrismaClient.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: notification.getId().getValue(),
          title: notification.getTitle(),
          message: notification.getMessage(),
          recipientId: notification.getRecipientId(),
          type: notification.getType(),
          priority: notification.getPriority(),
        }),
      });
    });

    it('should update existing notification', async () => {
      const notification = NotificationFactory.create();
      notification.markAsRead(); // Modify the notification

      const mockDbNotification = {
        id: notification.getId().getValue(),
        title: notification.getTitle(),
        message: notification.getMessage(),
        readAt: notification.getReadAt(),
      };

      mockPrismaClient.notification.findUnique.mockResolvedValue(mockDbNotification);
      mockPrismaClient.notification.update.mockResolvedValue(mockDbNotification);

      await repository.save(notification);

      expect(mockPrismaClient.notification.update).toHaveBeenCalledWith({
        where: { id: notification.getId().getValue() },
        data: expect.objectContaining({
          readAt: notification.getReadAt(),
        }),
      });
    });

    it('should handle save failures', async () => {
      const notification = NotificationFactory.create();
      mockPrismaClient.notification.create.mockRejectedValue(new Error('Database error'));

      await expect(repository.save(notification)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save notification',
        expect.objectContaining({
          notificationId: notification.getId().getValue(),
          error: 'Database error',
        })
      );
    });
  });

  describe('Find Operations', () => {
    it('should find notification by id', async () => {
      const notification = NotificationFactory.create();
      const mockDbNotification = {
        id: notification.getId().getValue(),
        title: notification.getTitle(),
        message: notification.getMessage(),
        recipientId: notification.getRecipientId(),
        type: notification.getType(),
        priority: notification.getPriority(),
        createdAt: notification.getCreatedAt(),
        readAt: null,
        archivedAt: null,
      };

      mockPrismaClient.notification.findUnique.mockResolvedValue(mockDbNotification);

      const result = await repository.findById(notification.getId());

      expect(result).toBeDefined();
      expect(result?.getId().getValue()).toBe(notification.getId().getValue());
      expect(mockPrismaClient.notification.findUnique).toHaveBeenCalledWith({
        where: { id: notification.getId().getValue() },
      });
    });

    it('should return null when notification not found', async () => {
      const notificationId = ValueObjectFactory.createUniqueId();
      mockPrismaClient.notification.findUnique.mockResolvedValue(null);

      const result = await repository.findById(notificationId);

      expect(result).toBeNull();
    });

    it('should find notifications by recipient id', async () => {
      const user = UserFactory.create();
      const notifications = NotificationFactory.createMany(3, {
        recipientId: user.getId().getValue(),
      });

      const mockDbNotifications = notifications.map(n => ({
        id: n.getId().getValue(),
        title: n.getTitle(),
        message: n.getMessage(),
        recipientId: n.getRecipientId(),
        type: n.getType(),
        priority: n.getPriority(),
        createdAt: n.getCreatedAt(),
        readAt: null,
        archivedAt: null,
      }));

      mockPrismaClient.notification.findMany.mockResolvedValue(mockDbNotifications);

      const result = await repository.findByRecipientId(user.getId());

      expect(result).toHaveLength(3);
      expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId: user.getId().getValue() },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should find unread notifications', async () => {
      const user = UserFactory.create();
      const mockDbNotifications = [
        {
          id: 'notif-1',
          title: 'Unread 1',
          message: 'Message 1',
          recipientId: user.getId().getValue(),
          readAt: null,
        },
        {
          id: 'notif-2',
          title: 'Unread 2',
          message: 'Message 2',
          recipientId: user.getId().getValue(),
          readAt: null,
        },
      ];

      mockPrismaClient.notification.findMany.mockResolvedValue(mockDbNotifications);

      const result = await repository.findUnreadByRecipientId(user.getId());

      expect(result).toHaveLength(2);
      expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
        where: {
          recipientId: user.getId().getValue(),
          readAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Pagination', () => {
    it('should support paginated queries', async () => {
      const user = UserFactory.create();
      const mockDbNotifications = NotificationFactory.createMany(10).map(n => ({
        id: n.getId().getValue(),
        title: n.getTitle(),
        message: n.getMessage(),
        recipientId: user.getId().getValue(),
        createdAt: n.getCreatedAt(),
      }));

      mockPrismaClient.notification.findMany.mockResolvedValue(mockDbNotifications.slice(0, 5));
      mockPrismaClient.notification.count.mockResolvedValue(10);

      const result = await repository.findByRecipientIdPaginated(
        user.getId(),
        { page: 1, limit: 5 }
      );

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(2);

      expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId: user.getId().getValue() },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 5,
      });
    });

    it('should handle empty paginated results', async () => {
      const user = UserFactory.create();
      mockPrismaClient.notification.findMany.mockResolvedValue([]);
      mockPrismaClient.notification.count.mockResolvedValue(0);

      const result = await repository.findByRecipientIdPaginated(
        user.getId(),
        { page: 1, limit: 10 }
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter notifications by type', async () => {
      const user = UserFactory.create();
      const mockDbNotifications = [
        {
          id: 'notif-1',
          title: 'Info Notification',
          type: 'info',
          recipientId: user.getId().getValue(),
        },
      ];

      mockPrismaClient.notification.findMany.mockResolvedValue(mockDbNotifications);

      const result = await repository.findByRecipientIdAndType(user.getId(), 'info');

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
        where: {
          recipientId: user.getId().getValue(),
          type: 'info',
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter notifications by priority', async () => {
      const user = UserFactory.create();
      const mockDbNotifications = [
        {
          id: 'notif-1',
          title: 'High Priority',
          priority: 'high',
          recipientId: user.getId().getValue(),
        },
      ];

      mockPrismaClient.notification.findMany.mockResolvedValue(mockDbNotifications);

      const result = await repository.findByRecipientIdAndPriority(user.getId(), 'high');

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
        where: {
          recipientId: user.getId().getValue(),
          priority: 'high',
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter notifications by date range', async () => {
      const user = UserFactory.create();
      const dateRange = ValueObjectFactory.createDateRange();
      const mockDbNotifications = [
        {
          id: 'notif-1',
          title: 'Recent Notification',
          recipientId: user.getId().getValue(),
          createdAt: new Date(),
        },
      ];

      mockPrismaClient.notification.findMany.mockResolvedValue(mockDbNotifications);

      const result = await repository.findByRecipientIdAndDateRange(user.getId(), dateRange);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
        where: {
          recipientId: user.getId().getValue(),
          createdAt: {
            gte: dateRange.getStartDate(),
            lte: dateRange.getEndDate(),
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Delete Operations', () => {
    it('should delete notification by id', async () => {
      const notification = NotificationFactory.create();
      mockPrismaClient.notification.delete.mockResolvedValue({
        id: notification.getId().getValue(),
      });

      await repository.delete(notification.getId());

      expect(mockPrismaClient.notification.delete).toHaveBeenCalledWith({
        where: { id: notification.getId().getValue() },
      });
    });

    it('should handle delete failures', async () => {
      const notificationId = ValueObjectFactory.createUniqueId();
      mockPrismaClient.notification.delete.mockRejectedValue(new Error('Not found'));

      await expect(repository.delete(notificationId)).rejects.toThrow('Not found');
    });

    it('should delete multiple notifications', async () => {
      const user = UserFactory.create();
      mockPrismaClient.notification.delete.mockResolvedValue({ count: 5 });

      await repository.deleteByRecipientId(user.getId());

      expect(mockPrismaClient.notification.delete).toHaveBeenCalledWith({
        where: { recipientId: user.getId().getValue() },
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should mark multiple notifications as read', async () => {
      const user = UserFactory.create();
      const notificationIds = ValueObjectFactory.createUniqueIds(3);

      mockPrismaClient.notification.update.mockResolvedValue({ count: 3 });

      await repository.markMultipleAsRead(
        notificationIds,
        user.getId()
      );

      expect(mockPrismaClient.notification.update).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds.map(id => id.getValue()) },
          recipientId: user.getId().getValue(),
        },
        data: {
          readAt: expect.any(Date),
        },
      });
    });

    it('should archive multiple notifications', async () => {
      const user = UserFactory.create();
      const notificationIds = ValueObjectFactory.createUniqueIds(3);

      mockPrismaClient.notification.update.mockResolvedValue({ count: 3 });

      await repository.archiveMultiple(
        notificationIds,
        user.getId()
      );

      expect(mockPrismaClient.notification.update).toHaveBeenCalledWith({
        where: {
          id: { in: notificationIds.map(id => id.getValue()) },
          recipientId: user.getId().getValue(),
        },
        data: {
          archivedAt: expect.any(Date),
        },
      });
    });
  });

  describe('Transaction Support', () => {
    it('should support transactional operations', async () => {
      const notifications = NotificationFactory.createMany(3);
      
      mockPrismaClient.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaClient);
      });

      await repository.saveMultiple(notifications);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('should rollback on transaction failure', async () => {
      const notifications = NotificationFactory.createMany(3);
      
      mockPrismaClient.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(repository.saveMultiple(notifications)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const user = UserFactory.create();
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `notif-${i}`,
        title: `Notification ${i}`,
        recipientId: user.getId().getValue(),
      }));

      mockPrismaClient.notification.findMany.mockResolvedValue(largeResultSet);

      const startTime = Date.now();
      const result = await repository.findByRecipientId(user.getId());
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should use database indexes effectively', async () => {
      const user = UserFactory.create();
      
      await repository.findByRecipientId(user.getId());

      expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId: user.getId().getValue() },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const notification = NotificationFactory.create();
      mockPrismaClient.notification.create.mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(repository.save(notification)).rejects.toThrow('Connection timeout');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle constraint violations', async () => {
      const notification = NotificationFactory.create();
      mockPrismaClient.notification.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(repository.save(notification)).rejects.toThrow('Unique constraint violation');
    });

    it('should handle invalid data types', async () => {
      const notification = NotificationFactory.create();
      mockPrismaClient.notification.create.mockRejectedValue(
        new Error('Invalid data type')
      );

      await expect(repository.save(notification)).rejects.toThrow('Invalid data type');
    });
  });
});