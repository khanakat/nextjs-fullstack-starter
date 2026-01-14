import { Command } from '../../../../shared/application/base/command';
import { ExportFormat } from '../../domain/entities/export-job';

export interface CreateExportJobProps {
  reportId: string;
  format: ExportFormat;
  userId: string;
  organizationId?: string;
  options?: {
    includeCharts?: boolean;
    includeData?: boolean;
    pageSize?: 'A4' | 'A3' | 'LETTER';
    orientation?: 'portrait' | 'landscape';
    quality?: 'low' | 'medium' | 'high';
  };
  notifyOnCompletion?: boolean;
  notificationEmail?: string;
}

export class CreateExportJobCommand extends Command {
  public readonly props: CreateExportJobProps;

  constructor(props: CreateExportJobProps) {
    super(props.userId);
    this.props = props;
  }
}
