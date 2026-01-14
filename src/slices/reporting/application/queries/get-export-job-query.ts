import { Query } from '../../../../shared/application/base/query';

export interface GetExportJobProps {
  jobId: string;
  userId: string;
}

export class GetExportJobQuery extends Query {
  public readonly props: GetExportJobProps;

  constructor(props: GetExportJobProps) {
    super(props.userId);
    this.props = props;
  }
}
