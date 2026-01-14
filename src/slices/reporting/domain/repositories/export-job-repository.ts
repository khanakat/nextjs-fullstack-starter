import { ExportJob, ExportJobStatus, ExportFormat } from '../../domain/entities/export-job';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';

export interface IExportJobRepository {
  save(exportJob: ExportJob): Promise<void>;
  findById(id: UniqueId): Promise<ExportJob | null>;
  findByUserId(userId: string, filters?: {
    status?: ExportJobStatus;
    format?: ExportFormat;
    reportId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ jobs: ExportJob[]; total: number }>;
  findByQueueJobId(queueJobId: string): Promise<ExportJob | null>;
  delete(id: UniqueId): Promise<void>;
  deleteMany(ids: UniqueId[]): Promise<number>;
  countByUserId(userId: string): Promise<number>;
}
