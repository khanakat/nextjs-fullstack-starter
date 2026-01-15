import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface PublishReportCommandProps {
  reportId: string;
}

export class PublishReportCommand extends Command {
  readonly reportId: UniqueId;

  constructor(props: PublishReportCommandProps, userId?: string) {
    super(userId);
    this.reportId = UniqueId.create(props.reportId);
  }
}
