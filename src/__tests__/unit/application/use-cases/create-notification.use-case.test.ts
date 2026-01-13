import { CreateNotificationUseCase } from 'src/slices/notifications/application/use-cases/create-notification.use-case';
import { CreateNotificationCommand } from 'src/slices/notifications/application/commands/create-notification.command';
import { NotificationFactory } from '../../../factories/notification-factory';
import { UserFactory } from '../../../factories/user-factory';
import { ValueObjectFactory } from '../../../factories/value-object-factory';

describe('CreateNotificationUseCase', () => {
  let useCase: CreateNotificationUseCase;
  let mockNotificationRepository: any;
  let mockUserRepository: any;
  let mockEventBus: any;
  let mockNotificationRoutingService: any;

  beforeEach(() => {
    mockNotificationRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByRecipientId: jest.fn(),
      delete: jest.fn(),
    };

    mockUserRepository = {
      findById: jest.fn().mockResolvedValue(UserFactory.create()),
      save: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };

    mockNotificationRoutingService = {
      determineChannels: jest.fn().mockResolvedValue(ValueObjectFactory.createEnabledChannels()),
      validateRecipient: jest.fn().mockResolvedValue(true),
    };

    useCase = new CreateNotificationUseCase(
      mockNotificationRepository,
      mockUserRepository,
      mockEventBus,
      mockNotificationRoutingService
    );
  });

  describe('Successful Creation', () => {
    it('should create notification with valid command', async () => {
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'This is a test notification',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Notification',
          message: 'This is a test notification',
        })
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'NotificationCreated',
        })
      );
    });

    it('should create notification with all optional fields', async () => {
      const command = new CreateNotificationCommand({
        title: 'Complete Notification',
        message: 'Notification with all fields',
        recipientId: 'user-123',
        type: 'success',
        priority: 'high',
        organizationId: 'org-123',
        category: 'system',
        metadata: { source: 'api', version: '1.0' },
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
        channels: ['email', 'push'],
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'system',
          metadata: { source: 'api', version: '1.0' },
          scheduledFor: expect.any(Date),
        })
      );
    });

    it('should determine appropriate channels when not specified', async () => {
      const command = new CreateNotificationCommand({
        title: 'Auto Channel Notification',
        message: 'Channels will be determined automatically',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      await useCase.execute(command);

      expect(mockNotificationRoutingService.determineChannels).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          type: 'info',
          priority: 'medium',
        })
      );
    });

    it('should validate recipient exists', async () => {
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      await useCase.execute(command);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockNotificationRoutingService.validateRecipient).toHaveBeenCalledWith('user-123');
    });
  });

  describe('Validation Errors', () => {
    it('should fail when recipient does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'nonexistent-user',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Recipient not found');
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    it('should fail with invalid notification type', async () => {
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'invalid-type' as any,
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid notification type');
    });

    it('should fail with invalid priority', async () => {
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'invalid-priority' as any,
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid priority');
    });

    it('should fail with empty title', async () => {
      const command = new CreateNotificationCommand({
        title: '',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title cannot be empty');
    });

    it('should fail with empty message', async () => {
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: '',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Message cannot be empty');
    });

    it('should fail with invalid scheduled date', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
        scheduledFor: pastDate,
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Scheduled date cannot be in the past');
    });
  });

  describe('Repository Errors', () => {
    it('should handle repository save failures', async () => {
      mockNotificationRepository.save.mockRejectedValue(new Error('Database connection failed'));
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle user repository failures', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('User service unavailable'));
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User service unavailable');
    });
  });

  describe('Event Publishing', () => {
    it('should publish NotificationCreated event', async () => {
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      await useCase.execute(command);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'NotificationCreated',
          notificationId: expect.any(String),
          recipientId: 'user-123',
          organizationId: 'org-123',
        })
      );
    });

    it('should handle event publishing failures gracefully', async () => {
      mockEventBus.publish.mockRejectedValue(new Error('Event bus unavailable'));
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      // Should still succeed even if event publishing fails
      expect(result.success).toBe(true);
      expect(mockNotificationRepository.save).toHaveBeenCalled();
    });

    it('should not publish event if notification creation fails', async () => {
      mockNotificationRepository.save.mockRejectedValue(new Error('Save failed'));
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      await useCase.execute(command);

      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('Business Rules', () => {
    it('should enforce notification rate limits', async () => {
      // Mock that user has exceeded rate limit
      mockNotificationRoutingService.validateRecipient.mockResolvedValue(false);
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('should handle high priority notifications differently', async () => {
      const command = new CreateNotificationCommand({
        title: 'Urgent Notification',
        message: 'This is urgent',
        recipientId: 'user-123',
        type: 'error',
        priority: 'high',
        organizationId: 'org-123',
      });

      await useCase.execute(command);

      expect(mockNotificationRoutingService.determineChannels).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          priority: 'high',
        })
      );
    });

    it('should validate organization membership', async () => {
      const user = UserFactory.create({ organizationId: 'different-org' });
      mockUserRepository.findById.mockResolvedValue(user);
      
      const command = new CreateNotificationCommand({
        title: 'Test Notification',
        message: 'Test message',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not member of organization');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent notification creation', async () => {
      const commands = Array.from({ length: 10 }, (_, i) => 
        new CreateNotificationCommand({
          title: `Notification ${i}`,
          message: `Message ${i}`,
          recipientId: `user-${i}`,
          type: 'info',
          priority: 'medium',
          organizationId: 'org-123',
        })
      );

      const promises = commands.map(command => useCase.execute(command));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockNotificationRepository.save).toHaveBeenCalledTimes(10);
    });

    it('should complete within reasonable time', async () => {
      const command = new CreateNotificationCommand({
        title: 'Performance Test',
        message: 'Testing performance',
        recipientId: 'user-123',
        type: 'info',
        priority: 'medium',
        organizationId: 'org-123',
      });

      const startTime = Date.now();
      await useCase.execute(command);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});