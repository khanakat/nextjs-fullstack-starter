import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { Notification, NotificationStatus, NotificationCategory, NotificationPriority } from '../../../../shared/domain/notifications/entities/notification';
import type { INotificationRepository, NotificationSearchCriteria, NotificationSearchOptions } from '../../../../shared/domain/notifications/repositories/notification-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { TYPES } from '@/shared/infrastructure/di/types';

export interface GetNotificationsRequest {
  userId: string;
  organizationId?: string;
  status?: NotificationStatus;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  isRead?: boolean;
  isArchived?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'priority' | 'scheduledAt' | 'readAt';
  sortOrder?: 'asc' | 'desc';
}

// Align with tests that import GetNotificationsQuery
export type GetNotificationsQuery = GetNotificationsRequest;

export interface NotificationSummaryDto {
  id: string;
  userId: string;
  organizationId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
  archivedAt?: Date;
}

export interface GetNotificationsResult {
  notifications: NotificationSummaryDto[];
  total: number;
  hasMore: boolean;
  unreadCount: number;
}

@injectable()
export class GetNotificationsUseCase extends UseCase<GetNotificationsRequest, GetNotificationsResult> {
  constructor(
    @inject(TYPES.NotificationRepository) private readonly notificationRepository: INotificationRepository
  ) {
    super();
  }

  async execute(query: GetNotificationsRequest): Promise<Result<GetNotificationsResult>> {
    // Validate query (throws DomainError-derived ValidationError as tests expect)
    this.validateQuery(query);

    // Build search criteria using validated UniqueId (throws on invalid input)
    const criteria: NotificationSearchCriteria = {
      userId: new UniqueId(query.userId),
      organizationId: query.organizationId ? new UniqueId(query.organizationId) : undefined,
      status: query.status,
      category: query.category,
      priority: query.priority,
      isRead: query.isRead,
      isArchived: query.isArchived,
    };

    // Build search options with defaults
    const options: NotificationSearchOptions = {
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    };

    // Execute repository calls (propagate errors to reject promise)
    const searchResult = await this.notificationRepository.search(criteria, options);
    const unreadCount = await this.notificationRepository.getUnreadCount(new UniqueId(query.userId));

    // Map to DTOs
    const notificationDtos = searchResult.notifications.map((notification) => this.toDto(notification));

    return Result.success({
      notifications: notificationDtos,
      total: searchResult.total,
      hasMore: searchResult.hasMore,
      unreadCount,
    });
  }

  private validateQuery(query: GetNotificationsRequest): void {
    if (!query.userId) {
      throw new ValidationError('userId', 'User ID is required');
    }

    if (query.limit != null && query.limit < 1) {
      throw new ValidationError('limit', 'Limit must be positive');
    }

    if (query.limit != null && query.limit > 100) {
      throw new ValidationError('limit', 'Limit cannot exceed 100');
    }

    if (query.offset != null && query.offset < 0) {
      throw new ValidationError('offset', 'Offset must be non-negative');
    }
  }

  private toDto(notification: Notification): NotificationSummaryDto {
    return {
      id: notification.id.toString(),
      userId: notification.userId.toString(),
      organizationId: notification.organizationId?.toString(),
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      status: notification.status,
      metadata: notification.metadata,
      actionUrl: notification.actionUrl,
      imageUrl: notification.imageUrl,
      scheduledAt: notification.scheduledAt,
      expiresAt: notification.expiresAt,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      archivedAt: notification.archivedAt
    };
  }
}