import { Query } from '../../../../shared/application/base/query';

export interface GetNotificationProps {
  notificationId: string;
  userId: string;
}

export class GetNotificationQuery extends Query {
  public readonly props: GetNotificationProps;

  constructor(props: GetNotificationProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
