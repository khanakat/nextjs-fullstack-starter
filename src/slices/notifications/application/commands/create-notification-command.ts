import { Command } from '../../../../shared/application/base/command';
import type { NotificationTypeValue } from '../../domain';

export interface CreateNotificationProps {
  userId: string;
  title: string;
  message?: string;
  type: NotificationTypeValue;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms?: boolean;
  };
  deliverAt?: Date;
  expiresAt?: Date;
}

export class CreateNotificationCommand extends Command {
  public readonly props: CreateNotificationProps;

  constructor(props: CreateNotificationProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
