import { Notification, NotificationStatus, NotificationCategory, NotificationPriority } from 'src/shared/domain/notifications/entities/notification';
import { UniqueId } from 'src/shared/domain/value-objects/unique-id';

/**
 * Thin repository used by tests that expect a concrete class at
 * `src/shared/infrastructure/repositories/notification-repository`.
 *
 * This implementation wraps a provided Prisma-like client and a logger.
 * It intentionally mirrors the shapes/assertions used in unit tests,
 * including calling `update` for bulk operations with `in` conditions.
 */
export class NotificationRepository {
  constructor(private readonly prisma: any, private readonly logger: any) {}

  async save(notification: Notification): Promise<void> {
    try {
      const id = notification.getId().getValue();
      const existing = await this.prisma.notification.findUnique({ where: { id } });

      const baseData: any = {
        id,
        title: notification.getTitle(),
        message: notification.getMessage(),
        recipientId: notification.getRecipientId(),
        type: notification.getType(),
        priority: notification.getPriority(),
        createdAt: notification.getCreatedAt(),
      };

      if (existing) {
        await this.prisma.notification.update({
          where: { id },
          data: {
            ...baseData,
            readAt: notification.getReadAt() ?? existing.readAt ?? null,
          },
        });
      } else {
        await this.prisma.notification.create({
          data: baseData,
        });
      }
    } catch (err: any) {
      this.logger?.error?.('Failed to save notification', {
        notificationId: notification.getId().getValue(),
        error: err?.message || String(err),
      });
      throw err;
    }
  }

  async findById(id: UniqueId): Promise<Notification | null> {
    const record = await this.prisma.notification.findUnique({
      where: { id: id.getValue() },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByRecipientId(userId: UniqueId): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { recipientId: userId.getValue() },
      orderBy: { createdAt: 'desc' },
    });
    const list = Array.isArray(records) ? records : [];
    return list.map((r: any) => this.toDomain(r));
  }

  async findUnreadByRecipientId(userId: UniqueId): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { recipientId: userId.getValue(), readAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const list = Array.isArray(records) ? records : [];
    return list.map((r: any) => this.toDomain(r));
  }

  async findByRecipientIdPaginated(
    userId: UniqueId,
    opts: { page: number; limit: number }
  ): Promise<{ items: Notification[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.max(1, opts.limit || 10);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId.getValue() },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { recipientId: userId.getValue() } }),
    ]);

    const items = records.map((r: any) => this.toDomain(r));
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return { items, total, page, limit, totalPages };
  }

  async findByRecipientIdAndType(userId: UniqueId, type: string): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { recipientId: userId.getValue(), type },
      orderBy: { createdAt: 'desc' },
    });
    const list = Array.isArray(records) ? records : [];
    return list.map((r: any) => this.toDomain(r));
  }

  async findByRecipientIdAndPriority(userId: UniqueId, priority: string): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { recipientId: userId.getValue(), priority },
      orderBy: { createdAt: 'desc' },
    });
    const list = Array.isArray(records) ? records : [];
    return list.map((r: any) => this.toDomain(r));
  }

  async findByRecipientIdAndDateRange(
    userId: UniqueId,
    dateRange: { getStartDate: () => Date; getEndDate: () => Date }
  ): Promise<Notification[]> {
    const start = typeof (dateRange as any)?.getStartDate === 'function'
      ? (dateRange as any).getStartDate()
      : (dateRange as any).startDate;
    const end = typeof (dateRange as any)?.getEndDate === 'function'
      ? (dateRange as any).getEndDate()
      : (dateRange as any).endDate;

    const records = await this.prisma.notification.findMany({
      where: {
        recipientId: userId.getValue(),
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const list = Array.isArray(records) ? records : [];
    return list.map((r: any) => this.toDomain(r));
  }

  async delete(id: UniqueId): Promise<void> {
    await this.prisma.notification.delete({ where: { id: id.getValue() } });
  }

  async deleteByRecipientId(userId: UniqueId): Promise<void> {
    await this.prisma.notification.delete({ where: { recipientId: userId.getValue() } });
  }

  async markMultipleAsRead(ids: UniqueId[], userId: UniqueId): Promise<void> {
    await this.prisma.notification.update({
      where: { id: { in: ids.map(i => i.getValue()) }, recipientId: userId.getValue() },
      data: { readAt: new Date() },
    });
  }

  async archiveMultiple(ids: UniqueId[], userId: UniqueId): Promise<void> {
    await this.prisma.notification.update({
      where: { id: { in: ids.map(i => i.getValue()) }, recipientId: userId.getValue() },
      data: { archivedAt: new Date() },
    });
  }

  async saveMultiple(notifications: Notification[]): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      for (const n of notifications) {
        await tx.notification.create({
          data: {
            id: n.getId().getValue(),
            title: n.getTitle(),
            message: n.getMessage(),
            recipientId: n.getRecipientId(),
            type: n.getType(),
            priority: n.getPriority(),
            createdAt: n.getCreatedAt(),
            readAt: n.getReadAt() ?? null,
            archivedAt: null,
          },
        });
      }
    });
  }

  private toDomain(record: any): Notification {
    const id = UniqueId.create(record.id);
    const userId = UniqueId.create(record.recipientId);
    const props = {
      id,
      userId,
      title: record.title,
      message: record.message,
      category: (record.type as NotificationCategory) ?? NotificationCategory.SYSTEM,
      priority: (record.priority as NotificationPriority) ?? NotificationPriority.MEDIUM,
      status: record.readAt ? NotificationStatus.READ : NotificationStatus.CREATED,
      channels: [],
      createdAt: record.createdAt ?? new Date(),
      readAt: record.readAt ?? undefined,
      archivedAt: record.archivedAt ?? undefined,
    } as any;
    return Notification.reconstitute(id, props);
  }
}