import { Command } from '../../base/command';
import { UniqueId } from '../../../domain/value-objects/unique-id';

export interface CreateReportCommandProps {
  title: string;
  description?: string;
  config: Record<string, unknown>;
  isPublic?: boolean;
  templateId?: string;
  createdBy: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export class CreateReportCommand extends Command {
  readonly title: string;
  readonly description?: string;
  readonly config: Record<string, unknown>;
  readonly isPublic: boolean;
  readonly templateId?: UniqueId;
  readonly createdBy: UniqueId;
  readonly organizationId?: UniqueId;
  readonly metadata?: Record<string, unknown>;

  constructor(props: CreateReportCommandProps, userId?: string) {
    super(userId);
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
