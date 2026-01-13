import { Command } from '../../../../shared/application/base/command';

export interface DeleteNotificationProps {
  notificationId: string;
  userId: string;
}

export class DeleteNotificationCommand extends Command {
  public readonly props: DeleteNotificationProps;

  constructor(props: DeleteNotificationProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
