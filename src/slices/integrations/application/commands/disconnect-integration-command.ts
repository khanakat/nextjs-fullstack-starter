import { Command } from '@/shared/application/base/command';

/**
 * Command to disconnect an integration connection
 */
export class DisconnectIntegrationCommand extends Command {
  public readonly props: DisconnectIntegrationCommandProps;

  constructor(props: DisconnectIntegrationCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}

export interface DisconnectIntegrationCommandProps {
  integrationId: string;
  connectionId: string;
}
