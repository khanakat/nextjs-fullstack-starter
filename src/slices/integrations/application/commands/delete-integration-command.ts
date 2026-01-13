import { Command } from '../../../../shared/application/base/command';

/**
 * Delete Integration Command
 */
export class DeleteIntegrationCommand extends Command {
  readonly props: {
    integrationId: string;
  };

  constructor(props: { integrationId: string }) {
    super();
    this.props = props;
  }
}
