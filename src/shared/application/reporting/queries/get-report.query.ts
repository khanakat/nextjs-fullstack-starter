import { Query } from '../../base/query';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface GetReportQueryProps {
  reportId: string;
}

export class GetReportQuery extends Query<GetReportQueryProps> {
  readonly reportId: UniqueId;

  constructor(props: GetReportQueryProps) {
    super(props);
    this.reportId = UniqueId.create(props.reportId);
  }
}
