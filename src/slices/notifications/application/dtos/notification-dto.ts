export class NotificationDto {
  public readonly id: string;
  public readonly userId: string;
  public readonly title: string;
  public readonly message?: string;
  public readonly type: string;
  public readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  public readonly data?: Record<string, any>;
  public readonly actionUrl?: string;
  public readonly actionLabel?: string;
  public readonly read: boolean;
  public readonly createdAt: Date;
  public readonly readAt?: Date;
  public readonly channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms?: boolean;
  };
  public readonly deliverAt?: Date;
  public readonly expiresAt?: Date;
  public readonly status: string;

  constructor(props: {
    id: string;
    userId: string;
    title: string;
    message?: string;
    type: string;
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
    status: string;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.title = props.title;
    this.message = props.message;
    this.type = props.type;
    this.priority = props.priority;
    this.data = props.data;
    this.actionUrl = props.actionUrl;
    this.actionLabel = props.actionLabel;
    this.read = props.read;
    this.createdAt = props.createdAt;
    this.readAt = props.readAt;
    this.channels = props.channels;
    this.deliverAt = props.deliverAt;
    this.expiresAt = props.expiresAt;
    this.status = props.status;
  }

  public toObject() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      message: this.message,
      type: this.type,
      priority: this.priority,
      data: this.data,
      actionUrl: this.actionUrl,
      actionLabel: this.actionLabel,
      read: this.read,
      createdAt: this.createdAt.toISOString(),
      readAt: this.readAt?.toISOString(),
      channels: this.channels,
      deliverAt: this.deliverAt?.toISOString(),
      expiresAt: this.expiresAt?.toISOString(),
      status: this.status,
    };
  }
}
