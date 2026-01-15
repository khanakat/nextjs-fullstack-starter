import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface ArchiveReportCommandProps {
  reportId: string;
}

export class ArchiveReportCommand extends Command {
  readonly reportId: UniqueId;

  constructor(props: ArchiveReportCommandProps, userId?: string) {
    super(userId);
    this.reportId = UniqueId.create(props.reportId);
  }
}
