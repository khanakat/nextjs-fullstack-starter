import { Command } from '../../../../shared/application/base/command';

export interface CancelExportJobProps {
  jobId: string;
  userId: string;
}

export class CancelExportJobCommand extends Command<CancelExportJobProps> {
  constructor(props: CancelExportJobProps) {
    super(props);
  }
}
