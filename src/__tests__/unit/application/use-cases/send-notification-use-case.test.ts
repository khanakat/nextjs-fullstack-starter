import { SendNotificationUseCase, SendNotificationCommand } from '../../../../slices/notifications/application/use-cases/send-notification-use-case';
import { INotificationRepository } from '../../../../shared/domain/notifications/repositories/notification-repository';
import { INotificationPreferencesRepository } from '../../../../shared/domain/notifications/repositories/notification-preferences-repository';
import { NotificationRoutingService } from '../../../../shared/domain/notifications/services/notification-routing-service';
import { Notification, NotificationCategory, NotificationPriority } from '../../../../shared/domain/notifications/entities/notification';
import { NotificationChannel } from '../../../../shared/domain/notifications/value-objects/notification-channel';
import { NotificationPreferences } from '../../../../shared/domain/notifications/value-objects/notification-preferences';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { DomainError } from '../../../../shared/domain/exceptions/domain-error';

// Mock repositories and services
const mockNotificationRepository: jest.Mocked<INotificationRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByOrganizationId: jest.fn(),
  markAsRead: jest.fn(),
  markAsDelivered: jest.fn(),
  delete: jest.fn(),
  findUnread: jest.fn(),
  findByCategory: jest.fn(),
  findByChannel: jest.fn(),
  findScheduled: jest.fn(),
  findExpired: jest.fn(),
};

const mockPreferencesRepository: jest.Mocked<INotificationPreferencesRepository> = {
  save: jest.fn(),
  findByUserId: jest.fn(),
  findByOrganizationId: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

// Mock the static method
jest.mock('../../../../shared/domain/notifications/services/notification-routing-service');
const MockNotificationRoutingService = NotificationRoutingService as jest.MockedClass<typeof NotificationRoutingService>;

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;
  let validCommand: SendNotificationCommand;

  beforeEach(() => {
    useCase = new SendNotificationUseCase(
      mockNotificationRepository,
      mockPreferencesRepository,
      new NotificationRoutingService()
    );
    
    // Reset all mocks
    jest.clearAllMocks();

    // Setup valid command
    validCommand = {
      userId: 'user-123',
      title: 'Test Notification',
      message: 'This is a test notification',
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.MEDIUM,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      metadata: { source: 'test' },
      actionUrl: 'https://example.com/action',
      imageUrl: 'https://example.com/image.png'
    };

    // Mock routing service
    MockNotificationRoutingService.routeNotification = jest.fn().mockReturnValue({
      shouldDeliver: true,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      delayUntil: undefined,
      reason: undefined
    });
  });

  describe('execute', () => {
    it('should send notification successfully with valid command', async () => {
      // Arrange
      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      mockNotificationRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result).toBeDefined();
      expect(result.notificationId).toBeDefined();
      expect(result.shouldDeliver).toBe(true);
      expect(result.deliveryChannels).toEqual([NotificationChannel.EMAIL, NotificationChannel.IN_APP]);
      expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1);
      expect(MockNotificationRoutingService.routeNotification).toHaveBeenCalledTimes(1);
    });

    it('should create default preferences when user has none', async () => {
      // Arrange
      mockPreferencesRepository.findByUserId.mockResolvedValue(null);
      mockNotificationRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result).toBeDefined();
      expect(result.shouldDeliver).toBe(true);
      expect(mockPreferencesRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect(MockNotificationRoutingService.routeNotification).toHaveBeenCalledWith(
        expect.any(Notification),
        expect.any(NotificationPreferences)
      );
    });

    it('should handle organization notifications', async () => {
      // Arrange
      const orgCommand = {
        ...validCommand,
        organizationId: 'org-456'
      };

      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      mockNotificationRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(orgCommand);

      // Assert
      expect(result).toBeDefined();
      expect(result.shouldDeliver).toBe(true);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: expect.objectContaining({ value: 'org-456' })
        })
      );
    });

    it('should handle scheduled notifications', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const scheduledCommand = {
        ...validCommand,
        scheduledAt: futureDate
      };

      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      mockNotificationRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(scheduledCommand);

      // Assert
      expect(result).toBeDefined();
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: futureDate
        })
      );
    });

    it('should handle notifications with expiration', async () => {
      // Arrange
      const expirationDate = new Date(Date.now() + 7200000); // 2 hours from now
      const expiringCommand = {
        ...validCommand,
        expiresAt: expirationDate
      };

      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      mockNotificationRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(expiringCommand);

      // Assert
      expect(result).toBeDefined();
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expirationDate
        })
      );
    });

    it('should handle routing decision to not deliver', async () => {
      // Arrange
      MockNotificationRoutingService.routeNotification = jest.fn().mockReturnValue({
        shouldDeliver: false,
        channels: [],
        delayUntil: undefined,
        reason: 'User has disabled notifications for this category'
      });

      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      mockNotificationRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.shouldDeliver).toBe(false);
      expect(result.deliveryChannels).toEqual([]);
      expect(result.reason).toBe('User has disabled notifications for this category');
      expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1); // Still saves the notification
    });

    it('should handle routing decision with delay', async () => {
      // Arrange
      const delayUntil = new Date(Date.now() + 1800000); // 30 minutes from now
      MockNotificationRoutingService.routeNotification = jest.fn().mockReturnValue({
        shouldDeliver: true,
        channels: [NotificationChannel.EMAIL],
        delayUntil: delayUntil,
        reason: 'User is in quiet hours'
      });

      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      mockNotificationRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.shouldDeliver).toBe(true);
      expect(result.delayUntil).toEqual(delayUntil);
      expect(result.reason).toBe('User is in quiet hours');
    });
  });

  describe('validation', () => {
    it('should throw error when userId is missing', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        userId: ''
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('User ID is required');
    });

    it('should throw error when title is missing', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        title: ''
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('Title is required');
    });

    it('should throw error when message is missing', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        message: ''
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('Message is required');
    });

    it('should throw error when category is missing', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        category: undefined as any
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('Category is required');
    });

    it('should throw error when channels are empty', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        channels: []
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('At least one channel is required');
    });

    it('should throw error when scheduled time is in the past', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const invalidCommand = {
        ...validCommand,
        scheduledAt: pastDate
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('Scheduled time cannot be in the past');
    });

    it('should throw error when expiration time is in the past', async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const invalidCommand = {
        ...validCommand,
        expiresAt: pastDate
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('Expiration time cannot be in the past');
    });

    it('should throw error when scheduled time is after expiration time', async () => {
      // Arrange
      const scheduledDate = new Date(Date.now() + 7200000); // 2 hours from now
      const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now
      const invalidCommand = {
        ...validCommand,
        scheduledAt: scheduledDate,
        expiresAt: expirationDate
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(DomainError);
      await expect(useCase.execute(invalidCommand)).rejects.toThrow('Scheduled time must be before expiration time');
    });
  });

  describe('error handling', () => {
    it('should handle repository save errors', async () => {
      // Arrange
      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      mockNotificationRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow('Database error');
    });

    it('should handle preferences repository errors', async () => {
      // Arrange
      mockPreferencesRepository.findByUserId.mockRejectedValue(new Error('Preferences service unavailable'));

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow('Preferences service unavailable');
    });

    it('should handle routing service errors', async () => {
      // Arrange
      const mockPreferences = NotificationPreferences.createDefault('user-123');
      mockPreferencesRepository.findByUserId.mockResolvedValue(mockPreferences);
      MockNotificationRoutingService.routeNotification = jest.fn().mockImplementation(() => {
        throw new Error('Routing service error');
      });

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow('Routing service error');
    });
  });
});