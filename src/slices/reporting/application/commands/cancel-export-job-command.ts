import { Command } from '../../../../shared/application/base/command';

export interface CancelExportJobProps {
  jobId: string;
  userId: string;
}

export class CancelExportJobCommand extends Command {
  public readonly props: CancelExportJobProps;

  constructor(props: CancelExportJobProps) {
    super(props.userId);
    this.props = props;
  }
}
