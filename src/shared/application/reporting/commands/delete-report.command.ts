import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface DeleteReportCommandProps {
  reportId: string;
}

export class DeleteReportCommand extends Command {
  readonly reportId: UniqueId;

  constructor(props: DeleteReportCommandProps, userId?: string) {
    super(userId);
    this.reportId = UniqueId.create(props.reportId);
  }
}
