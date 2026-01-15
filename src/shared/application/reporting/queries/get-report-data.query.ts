import { Query } from '../../base/query';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface GetReportDataQueryProps {
  reportId: string;
  format?: 'json' | 'csv' | 'pdf';
}

export class GetReportDataQuery extends Query {
  readonly reportId: UniqueId;
  readonly format: 'json' | 'csv' | 'pdf';

  constructor(props: GetReportDataQueryProps, userId?: string) {
    super(userId);
    this.reportId = UniqueId.create(props.reportId);
    this.format = props.format || 'json';
  }
}
