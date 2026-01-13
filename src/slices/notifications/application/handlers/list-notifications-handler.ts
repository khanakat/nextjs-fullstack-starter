import { injectable, inject } from 'inversify';
import { IQueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { ListNotificationsQuery } from '../queries/list-notifications-query';
import type { INotificationRepository } from '../../domain/repositories/notification-repository';
import { NotificationDto } from '../dtos/notification-dto';
import { PaginatedNotificationsDto } from '../dtos/paginated-notifications-dto';
import { createPaginationDto } from '../../../../shared/application/base/dto';

/**
 * List Notifications Handler
 * Handles retrieving notifications with filters and pagination
 */
@injectable()
export class ListNotificationsHandler implements IQueryHandler<ListNotificationsQuery, PaginatedNotificationsDto> {
  constructor(
    @inject('NotificationRepository')
    private readonly notificationRepository: INotificationRepository
  ) {}

  async handle(query: ListNotificationsQuery): Promise<Result<PaginatedNotificationsDto>> {
    // Validate query
    const validationResult = this.validate(query);
    if (!validationResult.isValid) {
      return Result.failure<PaginatedNotificationsDto>(new Error(validationResult.errors.join(', ')));
    }

    // Get notifications
    const notifications = await this.notificationRepository.findByUserId(query.props.userId, {
      limit: query.props.limit || 50,
      offset: query.props.offset || 0,
      unreadOnly: query.props.unreadOnly,
      type: query.props.type,
      status: query.props.status,
    });

    // Get total count
    const total = notifications.length;

    // Create pagination metadata
    const pagination = createPaginationDto(
      Math.floor((query.props.offset || 0) / (query.props.limit || 50)) + 1,
      query.props.limit || 50,
      total
    );

    // Convert to DTOs
    const data = notifications.map(notification => this.toDto(notification));

    // Return paginated result
    return Result.success(new PaginatedNotificationsDto({ data, pagination }));
  }

  private validate(query: ListNotificationsQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!query.props.userId || query.props.userId.trim() === '') {
      errors.push('User ID is required');
    }

    if (query.props.limit && query.props.limit <= 0) {
      errors.push('Limit must be greater than 0');
    }

    if (query.props.limit && query.props.limit > 100) {
      errors.push('Limit cannot exceed 100');
    }

    if (query.props.offset && query.props.offset < 0) {
      errors.push('Offset cannot be negative');
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
