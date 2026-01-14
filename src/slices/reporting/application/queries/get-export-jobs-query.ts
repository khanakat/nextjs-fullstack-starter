import { Query } from '../../../../shared/application/base/query';
import { ExportJobStatus } from '../../domain/entities/export-job';
import { ExportFormat } from '../../domain/entities/export-job';

export interface GetExportJobsProps {
  userId: string;
  status?: ExportJobStatus;
  format?: ExportFormat;
  reportId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class GetExportJobsQuery extends Query<GetExportJobsProps> {
  constructor(props: GetExportJobsProps) {
    super(props);
  }
}
