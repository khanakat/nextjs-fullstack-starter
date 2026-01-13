import { Query } from '../../../../shared/application/base/query';
import { NotificationCategory, NotificationStatus, NotificationPriority } from '../../../../shared/domain/notifications/entities/notification';

export class GetNotificationsQuery extends Query {
  constructor(
    public readonly userId: string,
    public readonly organizationId?: string,
    public readonly status?: NotificationStatus,
    public readonly category?: NotificationCategory,
    public readonly priority?: NotificationPriority,
    public readonly isRead?: boolean,
    public readonly isArchived?: boolean,
    public readonly fromDate?: Date,
    public readonly toDate?: Date,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly sortBy: 'createdAt' | 'priority' | 'readAt' = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    super();
  }

  static create(params: {
    userId: string;
    organizationId?: string;
    status?: NotificationStatus;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    isRead?: boolean;
    isArchived?: boolean;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'priority' | 'readAt';
    sortOrder?: 'asc' | 'desc';
  }): GetNotificationsQuery {
    return new GetNotificationsQuery(
      params.userId,
      params.organizationId,
      params.status,
      params.category,
      params.priority,
      params.isRead,
      params.isArchived,
      params.fromDate,
      params.toDate,
      params.page,
      params.limit,
      params.sortBy,
      params.sortOrder
    );
  }
}