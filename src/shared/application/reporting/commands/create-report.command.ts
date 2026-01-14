import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface CreateReportCommandProps {
  title: string;
  description?: string;
  config: Record<string, any>;
  isPublic?: boolean;
  templateId?: string;
  createdBy: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export class CreateReportCommand extends Command<CreateReportCommandProps> {
  readonly title: string;
  readonly description?: string;
  readonly config: Record<string, any>;
  readonly isPublic: boolean;
  readonly templateId?: UniqueId;
  readonly createdBy: UniqueId;
  readonly organizationId?: UniqueId;
  readonly metadata?: Record<string, any>;

  constructor(props: CreateReportCommandProps) {
    super(props);
    this.title = props.title;
    this.description = props.description;
    this.config = props.config;
    this.isPublic = props.isPublic ?? false;
    this.templateId = props.templateId ? UniqueId.create(props.templateId) : undefined;
    this.createdBy = UniqueId.create(props.createdBy);
    this.organizationId = props.organizationId ? UniqueId.create(props.organizationId) : undefined;
    this.metadata = props.metadata;
  }
}
