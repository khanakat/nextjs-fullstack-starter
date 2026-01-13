import { Command } from '../../../../shared/application/base/command';

export interface DeleteOldNotificationsProps {
  userId: string;
  olderThanDays?: number;
}

export class DeleteOldNotificationsCommand extends Command {
  public readonly props: DeleteOldNotificationsProps;

  constructor(props: DeleteOldNotificationsProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
