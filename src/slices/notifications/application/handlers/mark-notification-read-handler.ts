import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { MarkNotificationReadCommand } from '../commands/mark-notification-read-command';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';
import { NotificationId } from '../../domain/value-objects/notification-id';
import { NotificationDto } from '../dtos/notification-dto';

/**
 * Mark Notification Read Handler
 * Handles marking a notification as read
 */
@injectable()
export class MarkNotificationReadHandler extends CommandHandler<MarkNotificationReadCommand, NotificationDto> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {
    super();
  }

  async handle(command: MarkNotificationReadCommand): Promise<Result<NotificationDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<NotificationDto>(new Error(validationResult.errors.join(', ')));
    }

    // Find notification
    const notificationId = NotificationId.fromValue(command.props.notificationId);
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      return Result.failure<NotificationDto>(new Error('Notification not found'));
    }

    // Check ownership
    if (notification.userId !== command.props.userId) {
      return Result.failure<NotificationDto>(new Error('Not authorized to access this notification'));
    }

    // Mark as read
    notification.markAsRead();

    // Update notification
    const updatedNotification = await this.notificationRepository.update(notification);

    // Return DTO
    return Result.success(this.toDto(updatedNotification));
  }

  private validate(command: MarkNotificationReadCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.notificationId || command.props.notificationId.trim() === '') {
      errors.push('Notification ID is required');
    }

    if (!command.props.userId || command.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(notification: any): NotificationDto {
    return new NotificationDto({
      id: notification.id.value,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type.value,
      priority: notification.priority,
      data: notification.data,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
      read: notification.read,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      channels: notification.channels,
      deliverAt: notification.deliverAt,
      expiresAt: notification.expiresAt,
      status: notification.status.value,
    });
  }
}
