export type NotificationType = 'info' | 'success' | 'error' | 'warning' | 'alert';

export type NotificationPriorityInput = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateNotificationCommandParams {
  title: string;
  message: string;
  recipientId: string;
  type: NotificationType;
  priority: NotificationPriorityInput;
  organizationId?: string;
  category?: string;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  channels?: string[];
}

/**
 * Simple data holder for create notification parameters used by tests.
 */
export class CreateNotificationCommand {
  public readonly title: string;
  public readonly message: string;
  public readonly recipientId: string;
  public readonly type: NotificationType;
  public readonly priority: NotificationPriorityInput;
  public readonly organizationId?: string;
  public readonly category?: string;
  public readonly metadata?: Record<string, any>;
  public readonly scheduledFor?: Date;
  public readonly channels?: string[];

  constructor(params: CreateNotificationCommandParams) {
    this.title = params.title;
    this.message = params.message;
    this.recipientId = params.recipientId;
    this.type = params.type;
    this.priority = params.priority;
    this.organizationId = params.organizationId;
    this.category = params.category;
    this.metadata = params.metadata;
    this.scheduledFor = params.scheduledFor;
    this.channels = params.channels;
  }
}