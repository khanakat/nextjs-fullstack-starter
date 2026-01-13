import { Command } from '../../../../shared/application/base/command';

export interface MarkAllNotificationsReadProps {
  userId: string;
}

export class MarkAllNotificationsReadCommand extends Command {
  public readonly props: MarkAllNotificationsReadProps;

  constructor(props: MarkAllNotificationsReadProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
