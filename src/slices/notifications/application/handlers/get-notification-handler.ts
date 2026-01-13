import { injectable, inject } from 'inversify';
import { IQueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { GetNotificationQuery } from '../queries/get-notification-query';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';
import { NotificationId } from '../../domain/value-objects/notification-id';
import { NotificationDto } from '../dtos/notification-dto';

/**
 * Get Notification Handler
 * Handles retrieving a single notification
 */
@injectable()
export class GetNotificationHandler implements IQueryHandler<GetNotificationQuery, NotificationDto> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {}

  async handle(query: GetNotificationQuery): Promise<Result<NotificationDto>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<NotificationDto>(new Error(validationResult.errors.join(', ')));
    }

    // Find notification
    const notificationId = NotificationId.fromValue(query.props.notificationId);
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      return Result.failure<NotificationDto>(new Error('Notification not found'));
    }

    // Check ownership
    if (notification.userId !== query.props.userId) {
      return Result.failure<NotificationDto>(new Error('Not authorized to access this notification'));
    }

    // Return DTO
    return Result.success(this.toDto(notification));
  }

  private validate(query: GetNotificationQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.props.notificationId || query.props.notificationId.trim() === '') {
      errors.push('Notification ID is required');
    }

    if (!query.props.userId || query.props.userId.trim() === '') {
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
