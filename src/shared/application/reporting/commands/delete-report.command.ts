import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface DeleteReportCommandProps {
  reportId: string;
}

export class DeleteReportCommand extends Command<DeleteReportCommandProps> {
  readonly reportId: UniqueId;

  constructor(props: DeleteReportCommandProps) {
    super(props);
    this.reportId = UniqueId.create(props.reportId);
  }
}
