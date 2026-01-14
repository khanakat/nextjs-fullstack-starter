import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface ArchiveReportCommandProps {
  reportId: string;
}

export class ArchiveReportCommand extends Command<ArchiveReportCommandProps> {
  readonly reportId: UniqueId;

  constructor(props: ArchiveReportCommandProps) {
    super(props);
    this.reportId = UniqueId.create(props.reportId);
  }
}
