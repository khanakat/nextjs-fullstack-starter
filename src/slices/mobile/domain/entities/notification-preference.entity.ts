/**
 * Notification Preference Entity
 * Represents user notification preferences
 */

export enum DeliveryMethod {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  ALL = 'all',
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export interface NotificationPreferenceInfo {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  taskAssignments: boolean;
  workflowUpdates: boolean;
  systemAlerts: boolean;
  reminders: boolean;
  marketing: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string | null;
  deliveryMethod: DeliveryMethod;
  frequency: NotificationFrequency;
  batchNotifications: boolean;
  mobileEnabled: boolean;
  desktopEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationPreference {
  constructor(private props: NotificationPreferenceInfo) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get pushEnabled(): boolean {
    return this.props.pushEnabled;
  }

  get emailEnabled(): boolean {
    return this.props.emailEnabled;
  }

  get smsEnabled(): boolean {
    return this.props.smsEnabled;
  }

  get taskAssignments(): boolean {
    return this.props.taskAssignments;
  }

  get workflowUpdates(): boolean {
    return this.props.workflowUpdates;
  }

  get systemAlerts(): boolean {
    return this.props.systemAlerts;
  }

  get reminders(): boolean {
    return this.props.reminders;
  }

  get marketing(): boolean {
    return this.props.marketing;
  }

  get quietHoursEnabled(): boolean {
    return this.props.quietHoursEnabled;
  }

  get quietHoursStart(): string | null {
    return this.props.quietHoursStart;
  }

  get quietHoursEnd(): string | null {
    return this.props.quietHoursEnd;
  }

  get quietHoursTimezone(): string | null {
    return this.props.quietHoursTimezone;
  }

  get deliveryMethod(): DeliveryMethod {
    return this.props.deliveryMethod;
  }

  get frequency(): NotificationFrequency {
    return this.props.frequency;
  }

  get batchNotifications(): boolean {
    return this.props.batchNotifications;
  }

  get mobileEnabled(): boolean {
    return this.props.mobileEnabled;
  }

  get desktopEnabled(): boolean {
    return this.props.desktopEnabled;
  }

  updatePreference<K extends keyof NotificationPreferenceInfo>(
    key: K,
    value: NotificationPreferenceInfo[K]
  ): void {
    this.props[key] = value;
    this.props.updatedAt = new Date();
  }

  updateMultiplePreferences(updates: Partial<NotificationPreferenceInfo>): void {
    Object.assign(this.props, updates);
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      pushEnabled: this.props.pushEnabled,
      emailEnabled: this.props.emailEnabled,
      smsEnabled: this.props.smsEnabled,
      taskAssignments: this.props.taskAssignments,
      workflowUpdates: this.props.workflowUpdates,
      systemAlerts: this.props.systemAlerts,
      reminders: this.props.reminders,
      marketing: this.props.marketing,
      quietHoursEnabled: this.props.quietHoursEnabled,
      quietHoursStart: this.props.quietHoursStart,
      quietHoursEnd: this.props.quietHoursEnd,
      quietHoursTimezone: this.props.quietHoursTimezone,
      deliveryMethod: this.props.deliveryMethod,
      frequency: this.props.frequency,
      batchNotifications: this.props.batchNotifications,
      mobileEnabled: this.props.mobileEnabled,
      desktopEnabled: this.props.desktopEnabled,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
