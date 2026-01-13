import { Entity } from '../../../../shared/domain/base/entity';
import { NotificationId } from '../value-objects/notification-id';
import { NotificationType, NotificationTypeValue } from '../value-objects/notification-type';
import { NotificationStatus } from '../value-objects/notification-status';

export interface NotificationProps {
  id: NotificationId;
  userId: string;
  title: string;
  message?: string;
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms?: boolean;
  };
  deliverAt?: Date;
  expiresAt?: Date;
  status: NotificationStatus;
}

/**
 * Notification Aggregate Root
 * Represents a user notification in the system
 */
export class Notification extends Entity<NotificationId> {
  private readonly _userId: string;
  private readonly _title: string;
  private readonly _message?: string;
  private readonly _type: NotificationType;
  private readonly _priority: 'low' | 'medium' | 'high' | 'urgent';
  private readonly _data?: Record<string, any>;
  private readonly _actionUrl?: string;
  private readonly _actionLabel?: string;
  private _read: boolean;
  private readonly _createdAt: Date;
  private _readAt?: Date;
  private readonly _channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms?: boolean;
  };
  private readonly _deliverAt?: Date;
  private readonly _expiresAt?: Date;
  private _status: NotificationStatus;

  private constructor(props: NotificationProps) {
    super(props.id);
    this._userId = props.userId;
    this._title = props.title;
    this._message = props.message;
    this._type = props.type;
    this._priority = props.priority;
    this._data = props.data;
    this._actionUrl = props.actionUrl;
    this._actionLabel = props.actionLabel;
    this._read = props.read;
    this._createdAt = props.createdAt;
    this._readAt = props.readAt;
    this._channels = props.channels;
    this._deliverAt = props.deliverAt;
    this._expiresAt = props.expiresAt;
    this._status = props.status;
  }

  /**
   * Create a new notification
   */
  public static create(props: Omit<NotificationProps, 'id' | 'createdAt' | 'read' | 'readAt' | 'status' | 'type'> & { type: NotificationTypeValue }): Notification {
    const notificationId = NotificationId.fromValue(props.userId + '_' + Date.now());
    const notificationStatus = NotificationStatus.create('pending');
    const notificationType = NotificationType.create(props.type);

    return new Notification({
      id: notificationId,
      userId: props.userId,
      title: props.title,
      message: props.message,
      type: notificationType,
      priority: props.priority,
      data: props.data,
      actionUrl: props.actionUrl,
      actionLabel: props.actionLabel,
      read: false,
      createdAt: new Date(),
      readAt: undefined,
      channels: props.channels,
      deliverAt: props.deliverAt,
      expiresAt: props.expiresAt,
      status: notificationStatus,
    });
  }

  /**
   * Reconstitute a notification from persistence
   */
  public static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(): void {
    if (this._read) {
      return;
    }
    this._read = true;
    this._readAt = new Date();
    this._status = NotificationStatus.create('read');
  }

  /**
   * Getters
   */
  public get userId(): string {
    return this._userId;
  }

  public get title(): string {
    return this._title;
  }

  public get message(): string | undefined {
    return this._message;
  }

  public get type(): NotificationType {
    return this._type;
  }

  public get priority(): 'low' | 'medium' | 'high' | 'urgent' {
    return this._priority;
  }

  public get data(): Record<string, any> | undefined {
    return this._data;
  }

  public get actionUrl(): string | undefined {
    return this._actionUrl;
  }

  public get actionLabel(): string | undefined {
    return this._actionLabel;
  }

  public get read(): boolean {
    return this._read;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get readAt(): Date | undefined {
    return this._readAt;
  }

  public get channels(): {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms?: boolean;
  } {
    return this._channels;
  }

  public get deliverAt(): Date | undefined {
    return this._deliverAt;
  }

  public get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  public get status(): NotificationStatus {
    return this._status;
  }
}
