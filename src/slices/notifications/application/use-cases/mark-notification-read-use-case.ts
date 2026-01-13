import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import type { INotificationRepository } from '../../../../shared/domain/notifications/repositories/notification-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { BusinessRuleViolationError } from '../../../../shared/domain/exceptions/business-rule-violation-error';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { TYPES } from '@/shared/infrastructure/di/types';

export interface MarkNotificationReadCommand {
  notificationId: string;
  userId: string; // For authorization
}

export interface MarkNotificationReadResult {
  success: boolean;
  notificationId: string;
  readAt: Date;
}

@injectable()
export class MarkNotificationReadUseCase extends UseCase<MarkNotificationReadCommand, MarkNotificationReadResult> {
  constructor(
    @inject(TYPES.NotificationRepository) private readonly notificationRepository: INotificationRepository
  ) {
    super();
  }

  async execute(command: MarkNotificationReadCommand): Promise<Result<MarkNotificationReadResult>> {
    return this.executeWithErrorHandling(command, async (command) => {
      // Validate command
      this.validateCommand(command);

      const notificationId = UniqueId.create(command.notificationId);
      const userId = UniqueId.create(command.userId);

      // Find notification
      const notification = await this.notificationRepository.findById(notificationId);
      if (!notification) {
        throw new NotFoundError('Notification', command.notificationId);
      }

      // Verify ownership
      if (!notification.userId.equals(userId)) {
        throw new BusinessRuleViolationError('NotificationOwnership', 'User is not authorized to mark this notification as read');
      }

      // Check if notification can be read
      if (!notification.canBeRead()) {
        throw new BusinessRuleViolationError('NotificationReadability', 'Notification cannot be marked as read (archived or expired)');
      }

      // Mark as read
      notification.markAsRead();

      // Save
      await this.notificationRepository.save(notification);

      return {
        success: true,
        notificationId: command.notificationId,
        readAt: notification.readAt!
      };
    });
  }

  private validateCommand(command: MarkNotificationReadCommand): void {
    if (!command.notificationId) {
      throw new ValidationError('notificationId', 'Notification ID is required');
    }

    if (!command.userId) {
      throw new ValidationError('userId', 'User ID is required');
    }
  }
}