import { Query } from '../../../../shared/application/base/query';

export interface DownloadExportFileProps {
  jobId: string;
  userId: string;
}

export class DownloadExportFileQuery extends Query<DownloadExportFileProps> {
  constructor(props: DownloadExportFileProps) {
    super(props);
  }
}
