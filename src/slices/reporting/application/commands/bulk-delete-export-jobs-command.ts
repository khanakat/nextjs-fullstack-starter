import { Command } from '../../../../shared/application/base/command';

export interface BulkDeleteExportJobsProps {
  jobIds: string[];
  userId: string;
}

export class BulkDeleteExportJobsCommand extends Command {
  public readonly props: BulkDeleteExportJobsProps;

  constructor(props: BulkDeleteExportJobsProps) {
    super(props.userId);
    this.props = props;
  }
}
