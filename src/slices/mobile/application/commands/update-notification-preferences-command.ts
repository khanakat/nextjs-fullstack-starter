/**
 * Update Notification Preferences Command
 */

import { DeliveryMethod, NotificationFrequency } from '../../domain/entities/notification-preference.entity';

export interface UpdateNotificationPreferencesInput {
  userId: string;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  taskAssignments?: boolean;
  workflowUpdates?: boolean;
  systemAlerts?: boolean;
  reminders?: boolean;
  marketing?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTimezone?: string;
  deliveryMethod?: DeliveryMethod;
  frequency?: NotificationFrequency;
  batchNotifications?: boolean;
  mobileEnabled?: boolean;
  desktopEnabled?: boolean;
}

export class UpdateNotificationPreferencesCommand {
  constructor(public readonly data: UpdateNotificationPreferencesInput) {}
}
