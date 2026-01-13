import { Query } from '../../../../shared/application/base/query';

export interface ListNotificationsProps {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: string;
  status?: string;
}

export class ListNotificationsQuery extends Query {
  public readonly props: ListNotificationsProps;

  constructor(props: ListNotificationsProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
