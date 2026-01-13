import { GetNotificationsUseCase, GetNotificationsQuery } from '../../../../../slices/notifications/application/use-cases/get-notifications-use-case';
import { INotificationRepository, NotificationSearchResult } from '../../../../../shared/domain/notifications/repositories/notification-repository';
import { Notification, NotificationStatus, NotificationCategory, NotificationPriority } from '../../../../../shared/domain/notifications/entities/notification';
import { NotificationChannel, ChannelType } from '../../../../../shared/domain/notifications/value-objects/notification-channel';
import { UniqueId } from '../../../../../shared/domain/value-objects/unique-id';
import { DomainError } from '../../../../../shared/domain/exceptions/domain-error';

describe('GetNotificationsUseCase', () => {
  let useCase: GetNotificationsUseCase;
  let mockRepository: jest.Mocked<INotificationRepository>;
  let userId: UniqueId;
  let organizationId: UniqueId;

  beforeEach(() => {
    userId = UniqueId.generate();
    organizationId = UniqueId.generate();

    mockRepository = {
      search: jest.fn(),
      getUnreadCount: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByOrganizationId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findReadyForDelivery: jest.fn(),
      findScheduledForDelivery: jest.fn(),
      findExpired: jest.fn(),
      markAsRead: jest.fn(),
      markMultipleAsRead: jest.fn(),
      archive: jest.fn(),
      archiveMultiple: jest.fn(),
      deleteMultiple: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      getStatistics: jest.fn(),
      getOrganizationStatistics: jest.fn(),
      cleanupOldNotifications: jest.fn(),
      findForStreaming: jest.fn(),
    };

    useCase = new GetNotificationsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should get notifications successfully', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        organizationId: organizationId.value,
        limit: 10,
        offset: 0,
      };

      const notifications = [
        createMockNotification({
          userId,
          organizationId,
          title: 'Test Notification 1',
          category: NotificationCategory.REPORT,
          priority: NotificationPriority.MEDIUM,
        }),
        createMockNotification({
          userId,
          organizationId,
          title: 'Test Notification 2',
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.HIGH,
        }),
      ];

      const searchResult: NotificationSearchResult = {
        notifications,
        total: 2,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(1);

      const result = await useCase.execute(query);

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.unreadCount).toBe(1);
      expect(result.notifications[0].title).toBe('Test Notification 1');
      expect(result.notifications[1].title).toBe('Test Notification 2');
    });

    it('should filter notifications by status', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        status: NotificationStatus.READ,
        limit: 10,
      };

      const notifications = [
        createMockNotification({
          userId,
          title: 'Read Notification',
          status: NotificationStatus.READ,
        }),
      ];

      const searchResult: NotificationSearchResult = {
        notifications,
        total: 1,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(0);

      const result = await useCase.execute(query);

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].title).toBe('Read Notification');
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(UniqueId),
          status: NotificationStatus.READ,
        }),
        expect.any(Object)
      );
    });

    it('should filter notifications by category', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        category: NotificationCategory.SECURITY,
        limit: 10,
      };

      const notifications = [
        createMockNotification({
          userId,
          title: 'Security Alert',
          category: NotificationCategory.SECURITY,
          priority: NotificationPriority.URGENT,
        }),
      ];

      const searchResult: NotificationSearchResult = {
        notifications,
        total: 1,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(1);

      const result = await useCase.execute(query);

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].category).toBe(NotificationCategory.SECURITY);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          category: NotificationCategory.SECURITY,
        }),
        expect.any(Object)
      );
    });

    it('should filter notifications by priority', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        priority: NotificationPriority.URGENT,
        limit: 10,
      };

      const notifications = [
        createMockNotification({
          userId,
          title: 'Urgent Notification',
          priority: NotificationPriority.URGENT,
        }),
      ];

      const searchResult: NotificationSearchResult = {
        notifications,
        total: 1,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(1);

      const result = await useCase.execute(query);

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].priority).toBe(NotificationPriority.URGENT);
    });

    it('should apply pagination correctly', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        limit: 5,
        offset: 10,
      };

      const notifications = Array.from({ length: 5 }, (_, i) =>
        createMockNotification({
          userId,
          title: `Notification ${i + 11}`,
        })
      );

      const searchResult: NotificationSearchResult = {
        notifications,
        total: 25,
        hasMore: true,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(3);

      const result = await useCase.execute(query);

      expect(result.notifications).toHaveLength(5);
      expect(result.total).toBe(25);
      expect(result.hasMore).toBe(true);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          limit: 5,
          offset: 10,
        })
      );
    });

    it('should apply sorting correctly', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        sortBy: 'priority',
        sortOrder: 'asc',
        limit: 10,
      };

      const notifications = [
        createMockNotification({
          userId,
          title: 'Low Priority',
          priority: NotificationPriority.LOW,
        }),
        createMockNotification({
          userId,
          title: 'High Priority',
          priority: NotificationPriority.HIGH,
        }),
      ];

      const searchResult: NotificationSearchResult = {
        notifications,
        total: 2,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(2);

      const result = await useCase.execute(query);

      expect(result.notifications).toHaveLength(2);
      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sortBy: 'priority',
          sortOrder: 'asc',
        })
      );
    });

    it('should use default values when not specified', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
      };

      const notifications = [createMockNotification({ userId })];
      const searchResult: NotificationSearchResult = {
        notifications,
        total: 1,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(1);

      const result = await useCase.execute(query);

      expect(mockRepository.search).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          limit: 20,
          offset: 0,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      );
    });

    it('should handle empty results', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
      };

      const searchResult: NotificationSearchResult = {
        notifications: [],
        total: 0,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(0);

      const result = await useCase.execute(query);

      expect(result.notifications).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(result.unreadCount).toBe(0);
    });
  });

  describe('validation', () => {
    it('should throw error for missing userId', async () => {
      const query: GetNotificationsQuery = {
        userId: '',
      };

      await expect(useCase.execute(query)).rejects.toThrow(DomainError);
      await expect(useCase.execute(query)).rejects.toThrow('User ID is required');
    });

    it('should throw error for invalid limit', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        limit: -1,
      };

      await expect(useCase.execute(query)).rejects.toThrow(DomainError);
      await expect(useCase.execute(query)).rejects.toThrow('Limit must be positive');
    });

    it('should throw error for invalid offset', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        offset: -1,
      };

      await expect(useCase.execute(query)).rejects.toThrow(DomainError);
      await expect(useCase.execute(query)).rejects.toThrow('Offset must be non-negative');
    });

    it('should throw error for limit exceeding maximum', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
        limit: 101,
      };

      await expect(useCase.execute(query)).rejects.toThrow(DomainError);
      await expect(useCase.execute(query)).rejects.toThrow('Limit cannot exceed 100');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
      };

      mockRepository.search.mockRejectedValue(new Error('Database connection failed'));

      await expect(useCase.execute(query)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid UniqueId conversion', async () => {
      const query: GetNotificationsQuery = {
        userId: 'invalid-uuid',
      };

      await expect(useCase.execute(query)).rejects.toThrow();
    });
  });

  describe('DTO conversion', () => {
    it('should convert notification to DTO correctly', async () => {
      const query: GetNotificationsQuery = {
        userId: userId.value,
      };

      const notification = createMockNotification({
        userId,
        organizationId,
        title: 'Test Notification',
        message: 'Test Message',
        category: NotificationCategory.REPORT,
        priority: NotificationPriority.HIGH,
        status: NotificationStatus.CREATED,
        metadata: { reportId: 'report-123' },
        actionUrl: 'https://example.com/report/123',
        imageUrl: 'https://example.com/image.png',
      });

      const searchResult: NotificationSearchResult = {
        notifications: [notification],
        total: 1,
        hasMore: false,
      };

      mockRepository.search.mockResolvedValue(searchResult);
      mockRepository.getUnreadCount.mockResolvedValue(1);

      const result = await useCase.execute(query);

      const dto = result.notifications[0];
      expect(dto.id).toBe(notification.id.value);
      expect(dto.userId).toBe(notification.userId.value);
      expect(dto.organizationId).toBe(notification.organizationId?.value);
      expect(dto.title).toBe('Test Notification');
      expect(dto.message).toBe('Test Message');
      expect(dto.category).toBe(NotificationCategory.REPORT);
      expect(dto.priority).toBe(NotificationPriority.HIGH);
      expect(dto.status).toBe(NotificationStatus.CREATED);
      expect(dto.metadata).toEqual({ reportId: 'report-123' });
      expect(dto.actionUrl).toBe('https://example.com/report/123');
      expect(dto.imageUrl).toBe('https://example.com/image.png');
    });
  });
});

function createMockNotification(overrides: Partial<{
  userId: UniqueId;
  organizationId: UniqueId;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata: Record<string, any>;
  actionUrl: string;
  imageUrl: string;
}>): Notification {
  const defaults = {
    userId: UniqueId.generate(),
    organizationId: UniqueId.generate(),
    title: 'Default Notification',
    message: 'Default message',
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.CREATED,
    channels: [NotificationChannel.create({ type: ChannelType.IN_APP, enabled: true })],
  };

  return Notification.create({
    ...defaults,
    ...overrides,
  });
}