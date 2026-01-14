import { Query } from '../../../../shared/application/base/query';

export interface DownloadExportFileProps {
  jobId: string;
  userId: string;
}

export class DownloadExportFileQuery extends Query {
  public readonly props: DownloadExportFileProps;

  constructor(props: DownloadExportFileProps) {
    super(props.userId);
    this.props = props;
  }
}
