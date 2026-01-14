import { Command } from '../../../../shared/application/base/command';

/**
 * Sync Integration Command Props
 */
export interface SyncIntegrationCommandProps {
  integrationId: string;
  connectionId?: string;
  syncType?: 'full' | 'incremental' | 'manual';
  options?: Record<string, any>;
  organizationId: string;
}

/**
 * Sync Integration Command
 */
export class SyncIntegrationCommand extends Command {
  public readonly props: SyncIntegrationCommandProps;

  constructor(props: SyncIntegrationCommandProps, userId?: string) {
    super(userId);
    this.props = {
      syncType: props.syncType || 'incremental',
      ...props,
    };
  }
}
