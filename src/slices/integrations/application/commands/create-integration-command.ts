import { Command } from '../../../../shared/application/base/command';
import { IntegrationStatus } from '../../domain/entities/integration';

/**
 * Create Integration Command
 */
export class CreateIntegrationCommand extends Command {
  readonly props: {
    name: string;
    type: string;
    provider: string;
    config: string;
    organizationId?: string;
    status?: IntegrationStatus;
    createdBy?: string;
  };

  constructor(props: {
    name: string;
    type: string;
    provider: string;
    config: string;
    organizationId?: string;
    status?: IntegrationStatus;
    createdBy?: string;
  }) {
    super();
    this.props = props;
  }
}
