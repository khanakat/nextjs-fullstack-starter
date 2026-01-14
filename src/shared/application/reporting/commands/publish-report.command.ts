import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface PublishReportCommandProps {
  reportId: string;
}

export class PublishReportCommand extends Command<PublishReportCommandProps> {
  readonly reportId: UniqueId;

  constructor(props: PublishReportCommandProps) {
    super(props);
    this.reportId = UniqueId.create(props.reportId);
  }
}
