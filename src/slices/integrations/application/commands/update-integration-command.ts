import { Command } from '../../../../shared/application/base/command';
import { IntegrationStatus } from '../../domain/entities/integration';

/**
 * Update Integration Command
 */
export class UpdateIntegrationCommand extends Command {
  readonly props: {
    integrationId: string;
    name?: string;
    type?: string;
    provider?: string;
    config?: string;
    status?: IntegrationStatus;
    lastSyncAt?: Date;
  };

  constructor(props: {
    integrationId: string;
    name?: string;
    type?: string;
    provider?: string;
    config?: string;
    status?: IntegrationStatus;
    lastSyncAt?: Date;
  }) {
    super();
    this.props = props;
  }
}
