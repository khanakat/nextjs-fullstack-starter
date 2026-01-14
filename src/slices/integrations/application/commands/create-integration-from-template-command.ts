import { Command } from '../../../../shared/application/base/command';

/**
 * Create Integration From Template Command Props
 */
export interface CreateIntegrationFromTemplateCommandProps {
  templateId: string;
  name?: string;
  customConfig?: Record<string, any>;
  organizationId: string;
}

/**
 * Create Integration From Template Command
 */
export class CreateIntegrationFromTemplateCommand extends Command {
  public readonly props: CreateIntegrationFromTemplateCommandProps;

  constructor(props: CreateIntegrationFromTemplateCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}
