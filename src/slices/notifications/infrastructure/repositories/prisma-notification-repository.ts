import { injectable } from 'inversify';
import { PrismaClient, Notification as PrismaNotification } from '@prisma/client';
import type {
  INotificationRepository,
  NotificationSearchCriteria,
  NotificationSearchOptions,
  NotificationSearchResult,
  NotificationStatistics,
} from '../../../../shared/domain/notifications/repositories/notification-repository';
import {
  Notification,
  NotificationStatus,
  NotificationCategory,
  NotificationPriority,
} from '../../../../shared/domain/notifications/entities/notification';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

/**
 * Prisma Notification Repository
 * Implements notification repository using Prisma ORM
 *
 * Note: The Prisma Notification model has limited fields.
 * Additional fields are stored in a JSON string in the message field.
 */
@injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    const data = this.toPersistence(notification);

    const existing = await this.prisma.notification.findUnique({
      where: { id: notification.id.value },
    });

    if (existing) {
      await this.prisma.notification.update({
        where: { id: notification.id.value },
        data,
      });
    } else {
      await this.prisma.notification.create({
        data,
      });
    }
  }

  async findById(id: UniqueId): Promise<Notification | null> {
    const prismaNotification = await this.prisma.notification.findUnique({
      where: { id: id.value },
    });

    return prismaNotification ? this.toDomain(prismaNotification) : null;
  }

  async findByUserId(
    userId: UniqueId,
    options?: NotificationSearchOptions
  ): Promise<NotificationSearchResult> {
    const where: any = { userId: userId.value };

    const prismaNotifications = await this.prisma.notification.findMany({
      where,
      orderBy: this.getOrderBy(options),
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    const total = await this.prisma.notification.count({ where });

    return {
      notifications: prismaNotifications.map((n) => this.toDomain(n)),
      total,
      hasMore: (options?.offset || 0) + prismaNotifications.length < total,
    };
  }

  async search(
    criteria: NotificationSearchCriteria,
    options?: NotificationSearchOptions
  ): Promise<NotificationSearchResult> {
    const where = this.buildWhereClause(criteria);

    const prismaNotifications = await this.prisma.notification.findMany({
      where,
      orderBy: this.getOrderBy(options),
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    const total = await this.prisma.notification.count({ where });

    return {
      notifications: prismaNotifications.map((n) => this.toDomain(n)),
      total,
      hasMore: (options?.offset || 0) + prismaNotifications.length < total,
    };
  }

  async findReadyForDelivery(limit?: number): Promise<Notification[]> {
    const now = new Date();
    const prismaNotifications = await this.prisma.notification.findMany({
      where: {
        read: false,
        // Additional filtering based on message JSON would be done in-memory
      },
      orderBy: { createdAt: 'asc' },
      take: limit || 100,
    });

    // Filter in-memory based on message data
    return prismaNotifications
      .map((n) => this.toDomain(n))
      .filter((n) => n.shouldBeDelivered());
  }

  async findScheduledForDelivery(
    currentTime: Date,
    limit?: number
  ): Promise<Notification[]> {
    const prismaNotifications = await this.prisma.notification.findMany({
      where: {
        read: false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit || 100,
    });

    // Filter in-memory based on scheduledAt from message data
    return prismaNotifications
      .map((n) => this.toDomain(n))
      .filter(
        (n) =>
          n.scheduledAt && n.scheduledAt <= currentTime && !n.isExpired()
      );
  }

  async findExpired(
    currentTime: Date,
    limit?: number
  ): Promise<Notification[]> {
    const prismaNotifications = await this.prisma.notification.findMany({
      where: {
        read: false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit || 100,
    });

    // Filter in-memory based on expiresAt from message data
    return prismaNotifications
      .map((n) => this.toDomain(n))
      .filter((n) => n.isExpired());
  }

  async markAsRead(id: UniqueId): Promise<void> {
    await this.prisma.notification.update({
      where: { id: id.value },
      data: { read: true },
    });
  }

  async markMultipleAsRead(ids: UniqueId[]): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: { in: ids.map((id) => id.value) } },
      data: { read: true },
    });
  }

  async archive(id: UniqueId): Promise<void> {
    // Since Prisma Notification model doesn't have an archivedAt field,
    // we use the message field to store this information
    const notification = await this.findById(id);
    if (!notification) {
      return;
    }

    notification.archive();
    await this.save(notification);
  }

  async archiveMultiple(ids: UniqueId[]): Promise<void> {
    for (const id of ids) {
      await this.archive(id);
    }
  }

  async delete(id: UniqueId): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: id.value },
    });
  }

  async deleteMultiple(ids: UniqueId[]): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { id: { in: ids.map((id) => id.value) } },
    });
  }

  async count(criteria: NotificationSearchCriteria): Promise<number> {
    const where = this.buildWhereClause(criteria);
    return this.prisma.notification.count({ where });
  }

  async exists(id: UniqueId): Promise<boolean> {
    const count = await this.prisma.notification.count({
      where: { id: id.value },
    });
    return count > 0;
  }

  async getStatistics(userId: UniqueId): Promise<NotificationStatistics> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: userId.value },
    });

    const domainNotifications = notifications.map((n) => this.toDomain(n));

    const stats: NotificationStatistics = {
      total: domainNotifications.length,
      unread: domainNotifications.filter((n) => !n.isRead()).length,
      byCategory: {
        [NotificationCategory.SYSTEM]: 0,
        [NotificationCategory.REPORT]: 0,
        [NotificationCategory.USER]: 0,
        [NotificationCategory.SECURITY]: 0,
        [NotificationCategory.BILLING]: 0,
        [NotificationCategory.MARKETING]: 0,
      },
      byPriority: {
        [NotificationPriority.LOW]: 0,
        [NotificationPriority.MEDIUM]: 0,
        [NotificationPriority.HIGH]: 0,
        [NotificationPriority.URGENT]: 0,
      },
      byStatus: {
        [NotificationStatus.CREATED]: 0,
        [NotificationStatus.READ]: 0,
        [NotificationStatus.ARCHIVED]: 0,
      },
    };

    for (const n of domainNotifications) {
      stats.byCategory[n.category]++;
      stats.byPriority[n.priority]++;
      stats.byStatus[n.status]++;
    }

    return stats;
  }

  async getOrganizationStatistics(
    organizationId: UniqueId
  ): Promise<NotificationStatistics> {
    // Since Prisma Notification model doesn't have organizationId,
    // we need to filter based on users in the organization
    // For now, return empty statistics
    return {
      total: 0,
      unread: 0,
      byCategory: {
        [NotificationCategory.SYSTEM]: 0,
        [NotificationCategory.REPORT]: 0,
        [NotificationCategory.USER]: 0,
        [NotificationCategory.SECURITY]: 0,
        [NotificationCategory.BILLING]: 0,
        [NotificationCategory.MARKETING]: 0,
      },
      byPriority: {
        [NotificationPriority.LOW]: 0,
        [NotificationPriority.MEDIUM]: 0,
        [NotificationPriority.HIGH]: 0,
        [NotificationPriority.URGENT]: 0,
      },
      byStatus: {
        [NotificationStatus.CREATED]: 0,
        [NotificationStatus.READ]: 0,
        [NotificationStatus.ARCHIVED]: 0,
      },
    };
  }

  async cleanupOldNotifications(olderThan: Date): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: olderThan },
        read: true, // Only delete read notifications
      },
    });

    return result.count;
  }

  async getUnreadCount(userId: UniqueId): Promise<number> {
    const count = await this.prisma.notification.count({
      where: {
        userId: userId.value,
        read: false,
      },
    });

    return count;
  }

  async findForStreaming(
    userId: UniqueId,
    lastEventId?: string
  ): Promise<Notification[]> {
    const where: any = { userId: userId.value };

    if (lastEventId) {
      // Filter for notifications created after the last event
      // This is a simplified implementation
      const lastNotification = await this.prisma.notification.findUnique({
        where: { id: lastEventId },
      });

      if (lastNotification) {
        where.createdAt = { gt: lastNotification.createdAt };
      }
    }

    const prismaNotifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return prismaNotifications.map((n) => this.toDomain(n));
  }

  private buildWhereClause(criteria: NotificationSearchCriteria): any {
    const where: any = {};

    if (criteria.userId) {
      where.userId = criteria.userId.value;
    }

    if (criteria.isRead !== undefined) {
      where.read = criteria.isRead;
    }

    if (criteria.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: criteria.createdBefore };
    }

    if (criteria.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: criteria.createdAfter };
    }

    // Note: organizationId, status, category, priority, isArchived,
    // scheduledBefore, scheduledAfter, expiresAfter, hasActionUrl
    // need to be filtered in-memory from message JSON

    return where;
  }

  private getOrderBy(options?: NotificationSearchOptions): any {
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    return { [sortBy]: sortOrder };
  }

  private toPersistence(notification: Notification): any {
    const messageData: any = {
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      status: notification.status,
      channels: notification.channels,
      metadata: notification.metadata,
      actionUrl: notification.actionUrl,
      imageUrl: notification.imageUrl,
      scheduledAt: notification.scheduledAt?.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
      readAt: notification.readAt?.toISOString(),
      archivedAt: notification.archivedAt?.toISOString(),
      organizationId: notification.organizationId?.value,
    };

    return {
      id: notification.id.value,
      userId: notification.userId.value,
      title: notification.title,
      message: JSON.stringify(messageData),
      type: notification.category,
      read: notification.isRead(),
      createdAt: notification.createdAt,
      entityId: notification.actionUrl || undefined,
      entityType: undefined,
    };
  }

  private toDomain(prismaNotification: PrismaNotification): Notification {
    let messageData: any = {};

    try {
      messageData = JSON.parse(prismaNotification.message || '{}');
    } catch {
      // If parsing fails, use raw message
      messageData = { message: prismaNotification.message };
    }

    return Notification.reconstitute(
      UniqueId.create(prismaNotification.id),
      {
        id: UniqueId.create(prismaNotification.id),
        userId: UniqueId.create(prismaNotification.userId),
        organizationId: messageData.organizationId
          ? UniqueId.create(messageData.organizationId)
          : undefined,
      title: prismaNotification.title,
      message: messageData.message || prismaNotification.message || '',
      category:
        messageData.category ||
        (prismaNotification.type as NotificationCategory) ||
        NotificationCategory.SYSTEM,
      priority:
        messageData.priority || NotificationPriority.MEDIUM,
      status:
        messageData.status ||
        (prismaNotification.read ? NotificationStatus.READ : NotificationStatus.CREATED),
      channels: messageData.channels || [],
      metadata: messageData.metadata,
      actionUrl: messageData.actionUrl || prismaNotification.entityId || undefined,
      imageUrl: messageData.imageUrl,
      scheduledAt: messageData.scheduledAt
        ? new Date(messageData.scheduledAt)
        : undefined,
      expiresAt: messageData.expiresAt
        ? new Date(messageData.expiresAt)
        : undefined,
      createdAt: new Date(prismaNotification.createdAt),
      readAt: messageData.readAt ? new Date(messageData.readAt) : undefined,
      archivedAt: messageData.archivedAt
        ? new Date(messageData.archivedAt)
        : undefined,
    });
  }
}
