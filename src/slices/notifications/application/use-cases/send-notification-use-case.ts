import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { Notification, NotificationCategory, NotificationPriority } from '../../../../shared/domain/notifications/entities/notification';
import { NotificationChannel } from '../../../../shared/domain/notifications/value-objects/notification-channel';
import { NotificationPreferences } from '../../../../shared/domain/notifications/value-objects/notification-preferences';
import type { INotificationRepository } from '../../../../shared/domain/notifications/repositories/notification-repository';
import type { INotificationPreferencesRepository } from '../../../../shared/domain/notifications/repositories/notification-preferences-repository';
import { NotificationRoutingService } from '../../../../shared/domain/notifications/services/notification-routing-service';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { TYPES } from '@/shared/infrastructure/di/types';

export interface SendNotificationRequest {
  userId: string;
  organizationId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface SendNotificationResult {
  notificationId: string;
  shouldDeliver: boolean;
  deliveryChannels: NotificationChannel[];
  delayUntil?: Date;
  reason?: string;
}

@injectable()
export class SendNotificationUseCase extends UseCase<SendNotificationRequest, SendNotificationResult> {
  constructor(
    @inject(TYPES.NotificationRepository) private readonly notificationRepository: INotificationRepository,
    @inject(TYPES.NotificationPreferencesRepository) private readonly preferencesRepository: INotificationPreferencesRepository,
    @inject(TYPES.NotificationRoutingService) private readonly routingService: NotificationRoutingService
  ) {
    super();
  }

  async execute(command: SendNotificationRequest): Promise<Result<SendNotificationResult>> {
      // Validate command
      this.validateCommand(command);

      // Create notification
      const notification = Notification.create(
        UniqueId.create(command.userId),
        command.title,
        command.message,
        command.category,
        command.priority,
        command.channels,
        command.organizationId ? UniqueId.create(command.organizationId) : undefined,
        command.metadata,
        command.actionUrl,
        command.imageUrl,
        command.scheduledAt,
        command.expiresAt
      );

      // Get user preferences
      const preferences = await this.preferencesRepository.findByUserId(command.userId);

      // If no preferences exist, create default ones
      const userPreferences = preferences || NotificationPreferences.createDefault(command.userId);

      // Determine routing
      const routingDecision = NotificationRoutingService.routeNotification(
        notification,
        userPreferences
      );

      // Save notification
      await this.notificationRepository.save(notification);

      return Result.success({
        notificationId: notification.id.toString(),
        shouldDeliver: routingDecision.shouldDeliver,
        deliveryChannels: routingDecision.channels,
        delayUntil: routingDecision.delayUntil,
        reason: routingDecision.reason,
      });
  }

  private validateCommand(command: SendNotificationRequest): void {
    if (!command.userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    if (!command.title || command.title.trim().length === 0) {
      throw new ValidationError('Title is required', 'title');
    }

    if (!command.message || command.message.trim().length === 0) {
      throw new ValidationError('Message is required', 'message');
    }

    if (!command.category) {
      throw new ValidationError('Category is required', 'category');
    }

    if (!command.channels || command.channels.length === 0) {
      throw new ValidationError('At least one channel is required', 'channels');
    }

    // Validate scheduled time
    if (command.scheduledAt && command.scheduledAt < new Date()) {
      throw new ValidationError('Scheduled time cannot be in the past', 'scheduledAt');
    }

    // Validate expiration time
    if (command.expiresAt && command.expiresAt < new Date()) {
      throw new ValidationError('Expiration time cannot be in the past', 'expiresAt');
    }

    // Validate scheduling logic
    if (command.scheduledAt && command.expiresAt && command.scheduledAt >= command.expiresAt) {
      throw new ValidationError('Scheduled time must be before expiration time', 'scheduledAt');
    }
  }
}