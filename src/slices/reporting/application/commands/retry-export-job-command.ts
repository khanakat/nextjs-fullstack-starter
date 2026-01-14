import { Command } from '../../../../shared/application/base/command';

export interface RetryExportJobProps {
  jobId: string;
  userId: string;
}

export class RetryExportJobCommand extends Command<RetryExportJobProps> {
  constructor(props: RetryExportJobProps) {
    super(props);
  }
}
