import { NotificationCategory, NotificationPriority } from '../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../shared/domain/notifications/value-objects/notification-channel';

export interface SendNotificationDto {
  userId: string;
  organizationId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: SendNotificationChannelDto[];
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface SendNotificationChannelDto {
  type: ChannelType;
  enabled: boolean;
  configuration?: Record<string, any>;
}

export interface BulkSendNotificationDto {
  userIds: string[];
  organizationId?: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: SendNotificationChannelDto[];
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  templateId?: string;
  templateData?: Record<string, any>;
  personalizeMessage?: boolean; // If true, use templateData to personalize per user
}

export interface SendNotificationResponseDto {
  notificationId: string;
  status: 'queued' | 'sent' | 'failed';
  message?: string;
  scheduledFor?: Date;
}

export interface BulkSendNotificationResponseDto {
  totalRequested: number;
  totalQueued: number;
  totalFailed: number;
  notifications: SendNotificationResponseDto[];
  failedUsers: Array<{
    userId: string;
    reason: string;
  }>;
}

export interface NotificationTemplateDto {
  id: string;
  name: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: SendNotificationChannelDto[];
  variables: string[]; // List of template variables like {{userName}}, {{amount}}
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}