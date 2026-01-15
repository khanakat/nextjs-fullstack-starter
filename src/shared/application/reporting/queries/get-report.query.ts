import { Query } from '../../base/query';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface GetReportQueryProps {
  reportId: string;
}

export class GetReportQuery extends Query {
  readonly reportId: UniqueId;

  constructor(props: GetReportQueryProps, userId?: string) {
    super(userId);
    this.reportId = UniqueId.create(props.reportId);
  }
}
