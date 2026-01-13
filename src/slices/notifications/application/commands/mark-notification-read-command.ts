import { Command } from '../../../../shared/application/base/command';

export interface MarkNotificationReadProps {
  notificationId: string;
  userId: string;
}

export class MarkNotificationReadCommand extends Command {
  public readonly props: MarkNotificationReadProps;

  constructor(props: MarkNotificationReadProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
