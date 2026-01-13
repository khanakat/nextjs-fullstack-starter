import { Command } from '../../../../shared/application/base/command';
import { WorkflowStatus } from '../../domain/entities/workflow';

/**
 * CreateWorkflowCommand
 * Command for creating a new workflow
 */
export interface CreateWorkflowCommandProps {
  name: string;
  description: string;
  organizationId: string;
  definition: string;
  settings: string;
  variables: string;
  createdBy: string;
  isTemplate?: boolean;
  isPublic?: boolean;
  status?: WorkflowStatus;
}

export class CreateWorkflowCommand extends Command {
  public readonly props: CreateWorkflowCommandProps;

  constructor(props: CreateWorkflowCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
