import { Command } from '../../../../shared/application/base/command';

/**
 * CreateWorkflowTemplateCommand
 * Command for creating a new workflow template
 */
export interface CreateWorkflowTemplateCommandProps {
  workflowId?: string;
  name: string;
  description?: string;
  category: string;
  template?: Record<string, any>;
  variables?: Record<string, any>;
  settings?: Record<string, any>;
  isBuiltIn?: boolean;
  isPublic?: boolean;
  tags?: string[];
  organizationId?: string;
  createdBy?: string;
}

export class CreateWorkflowTemplateCommand extends Command {
  public readonly props: CreateWorkflowTemplateCommandProps;

  constructor(props: CreateWorkflowTemplateCommandProps, userId?: string) {
    super(userId);
    this.props = {
      ...props,
      template: props.template || {},
      variables: props.variables || {},
      settings: props.settings || {},
      tags: props.tags || [],
      isBuiltIn: props.isBuiltIn || false,
      isPublic: props.isPublic || false,
    };
  }
}
