import { Command } from '../../../../shared/application/base/command';

export interface GenerateDirectExportProps {
  exportType: 'pdf' | 'csv' | 'excel';
  reportType: 'users' | 'analytics' | 'financial' | 'system-health' | 'custom';
  userId: string;
  organizationId?: string;
  filters?: Record<string, any>;
  options?: {
    includeCharts?: boolean;
    includeImages?: boolean;
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    fileName?: string;
  };
}

export class GenerateDirectExportCommand extends Command {
  public readonly props: GenerateDirectExportProps;

  constructor(props: GenerateDirectExportProps) {
    super(props.userId);
    this.props = props;
  }
}
