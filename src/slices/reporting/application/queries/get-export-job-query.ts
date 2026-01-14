import { Query } from '../../../../shared/application/base/query';

export interface GetExportJobProps {
  jobId: string;
  userId: string;
}

export class GetExportJobQuery extends Query<GetExportJobProps> {
  constructor(props: GetExportJobProps) {
    super(props);
  }
}
