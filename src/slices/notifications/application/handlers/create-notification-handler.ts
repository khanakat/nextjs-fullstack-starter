import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { CreateNotificationCommand } from '../commands/create-notification-command';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';
import { Notification } from '../../domain/entities/notification';
import { NotificationDto } from '../dtos/notification-dto';

/**
 * Create Notification Handler
 * Handles creation of new notifications
 */
@injectable()
export class CreateNotificationHandler extends CommandHandler<CreateNotificationCommand, NotificationDto> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {
    super();
  }

  async handle(command: CreateNotificationCommand): Promise<Result<NotificationDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<NotificationDto>(new Error(validationResult.errors.join(', ')));
    }

    // Create notification entity
    const notification = Notification.create({
      userId: command.props.userId,
      title: command.props.title,
      message: command.props.message,
      type: command.props.type,
      priority: command.props.priority,
      data: command.props.data,
      actionUrl: command.props.actionUrl,
      actionLabel: command.props.actionLabel,
      channels: command.props.channels,
      deliverAt: command.props.deliverAt,
      expiresAt: command.props.expiresAt,
    });

    // Save notification
    const createdNotification = await this.notificationRepository.create(notification);

    // Return DTO
    return Result.success(this.toDto(createdNotification));
  }

  private validate(command: CreateNotificationCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.userId || command.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    if (!command.props.title || command.props.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!command.props.type || command.props.type.trim() === '') {
      errors.push('Type is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(notification: Notification): NotificationDto {
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
