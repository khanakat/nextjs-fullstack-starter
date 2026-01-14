import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface UpdateReportCommandProps {
  reportId: string;
  title?: string;
  description?: string;
  config?: Record<string, any>;
  content?: any;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export class UpdateReportCommand extends Command<UpdateReportCommandProps> {
  readonly reportId: UniqueId;
  readonly title?: string;
  readonly description?: string;
  readonly config?: Record<string, any>;
  readonly content?: any;
  readonly isPublic?: boolean;
  readonly metadata?: Record<string, any>;

  constructor(props: UpdateReportCommandProps) {
    super(props);
    this.reportId = UniqueId.create(props.reportId);
    this.title = props.title;
    this.description = props.description;
    this.config = props.config;
    this.content = props.content;
    this.isPublic = props.isPublic;
    this.metadata = props.metadata;
  }
}
