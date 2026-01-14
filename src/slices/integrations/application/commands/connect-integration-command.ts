import { Command } from '@/shared/domain/command';

/**
 * Connection types supported
 */
export type ConnectionType = 'oauth' | 'api_key' | 'basic_auth' | 'bearer_token' | 'custom';

/**
 * Command to connect an integration (OAuth or direct credentials)
 */
export class ConnectIntegrationCommand extends Command {
  public readonly props: ConnectIntegrationCommandProps;

  constructor(props: ConnectIntegrationCommandProps, userId?: string) {
    super(userId);
    this.props = props;
  }
}

export interface ConnectIntegrationCommandProps {
  integrationId: string;
  connectionType: ConnectionType;
  credentials?: Record<string, any>;
  config?: Record<string, any>;
  redirectUrl?: string;
}
