/**
 * Send Push Notification Command
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vibrate?: number[];
}

export interface PushOptions {
  userId?: string;
  organizationId?: string;
  targetUsers?: string[];
  targetRoles?: string[];
  schedule?: string;
  ttl?: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;
}

export interface SendPushNotificationInput {
  payload: NotificationPayload;
  options?: PushOptions;
  sentByUserId: string;
}

export class SendPushNotificationCommand {
  constructor(public readonly data: SendPushNotificationInput) {}
}
