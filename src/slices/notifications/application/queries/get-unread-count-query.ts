import { Query } from '../../../../shared/application/base/query';

export interface GetUnreadCountProps {
  userId: string;
}

export class GetUnreadCountQuery extends Query {
  public readonly props: GetUnreadCountProps;

  constructor(props: GetUnreadCountProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
