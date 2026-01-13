import { NotificationCategory } from '../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../shared/domain/notifications/value-objects/notification-channel';

export interface NotificationPreferencesDto {
  id: string;
  userId: string;
  organizationId?: string;
  globalEnabled: boolean;
  categoryPreferences: CategoryPreferenceDto[];
  channelPreferences: ChannelPreferenceDto[];
  quietHours?: QuietHoursDto;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryPreferenceDto {
  category: NotificationCategory;
  enabled: boolean;
  channels: ChannelType[];
  priority?: 'high' | 'medium' | 'low';
}

export interface ChannelPreferenceDto {
  type: ChannelType;
  enabled: boolean;
  configuration?: Record<string, any>;
}

export interface QuietHoursDto {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone?: string;
  daysOfWeek?: number[]; // 0-6, where 0 is Sunday
}

export interface UpdateNotificationPreferencesDto {
  globalEnabled?: boolean;
  categoryPreferences?: CategoryPreferenceDto[];
  channelPreferences?: ChannelPreferenceDto[];
  quietHours?: QuietHoursDto;
  timezone?: string;
}

export interface NotificationPreferencesSearchDto {
  userId?: string;
  organizationId?: string;
  globalEnabled?: boolean;
  category?: NotificationCategory;
  channelType?: ChannelType;
}

export interface BulkUpdatePreferencesDto {
  userIds: string[];
  organizationId?: string;
  preferences: UpdateNotificationPreferencesDto;
}