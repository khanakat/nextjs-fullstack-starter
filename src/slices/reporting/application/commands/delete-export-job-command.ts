import { Command } from '../../../../shared/application/base/command';

export interface DeleteExportJobProps {
  jobId: string;
  userId: string;
}

export class DeleteExportJobCommand extends Command<DeleteExportJobProps> {
  constructor(props: DeleteExportJobProps) {
    super(props);
  }
}
