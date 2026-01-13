import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { INotificationPreferencesRepository } from '../../../../shared/domain/notifications/repositories/notification-preferences-repository';
import { NotificationPreferences, CategoryPreference } from '../../../../shared/domain/notifications/value-objects/notification-preferences';
import { NotificationCategory } from '../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../shared/domain/notifications/value-objects/notification-channel';
import { TYPES } from '@/shared/infrastructure/di/types';

@injectable()
export class PrismaNotificationPreferencesRepository implements INotificationPreferencesRepository {
  constructor(@inject(TYPES.PrismaClient) private readonly prisma: PrismaClient) {}

  async save(preferences: NotificationPreferences): Promise<void> {
    // Map domain model to Prisma schema
    const now = new Date();
    const base = {
      userId: preferences.userId,
      pushEnabled: preferences.globalEnabled,
      emailEnabled: preferences.globalEnabled,
      smsEnabled: false,
      taskAssignments: true,
      workflowUpdates: true,
      systemAlerts: true,
      reminders: true,
      marketing: false,
      quietHoursEnabled: !!preferences.quietHours,
      quietHoursStart: preferences.quietHours?.start ?? '22:00',
      quietHoursEnd: preferences.quietHours?.end ?? '08:00',
      quietHoursTimezone: preferences.quietHours?.timezone ?? 'UTC',
      deliveryMethod: preferences.emailDigest?.enabled ? 'email' : 'push',
      frequency: preferences.emailDigest?.frequency ?? 'daily',
      batchNotifications: false,
      mobileEnabled: true,
      desktopEnabled: true,
    };

    await this.prisma.notificationPreferences.upsert({
      where: { userId: preferences.userId },
      create: { ...base, createdAt: now, updatedAt: now },
      update: { ...base, updatedAt: now },
    });
  }

  async findByUserId(userId: string): Promise<NotificationPreferences | null> {
    const record = await this.prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    if (!record) {
      return null;
    }

    return this.toDomain(record);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.notificationPreferences.delete({
      where: { userId }
    });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.prisma.notificationPreferences.count({
      where: { userId }
    });
    return count > 0;
  }

  async findUsersWithEmailDigestEnabled(): Promise<NotificationPreferences[]> {
    // Simplified implementation - find users with email enabled
    const records = await this.prisma.notificationPreferences.findMany({
      where: {
        emailEnabled: true,
      },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  async findUsersByDigestFrequency(frequency: 'daily' | 'weekly'): Promise<NotificationPreferences[]> {
    // Simplified implementation - find users with email enabled and matching frequency
    const records = await this.prisma.notificationPreferences.findMany({
      where: {
        emailEnabled: true,
        frequency: frequency,
      },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  private toDomain(record: any): NotificationPreferences {
    // Map from Prisma schema fields to domain model
    // Note: This is a simplified mapping - domain model expects richer structure
    const categoryPreferences: CategoryPreference[] = [];
    const defaultChannels: ChannelType[] = [ChannelType.IN_APP];

    // Map quiet hours from Prisma schema
    let quietHours: { start: string; end: string; timezone: string } | undefined = undefined;
    if (record.quietHoursEnabled) {
      quietHours = {
        start: record.quietHoursStart,
        end: record.quietHoursEnd,
        timezone: record.quietHoursTimezone ?? 'UTC',
      };
    }

    // Simplified email digest mapping
    const emailDigest = record.emailEnabled
      ? {
          enabled: true,
          frequency: (record.frequency === 'daily' || record.frequency === 'weekly') ? record.frequency : 'daily',
          time: '09:00',
        }
      : undefined;

    const language = 'en';
    const timezone = 'UTC';

    return NotificationPreferences.create(
      record.userId,
      record.pushEnabled || record.emailEnabled, // Use push/email enabled as global enabled
      categoryPreferences,
      defaultChannels,
      quietHours,
      emailDigest,
      language,
      timezone
    );
  }
}
